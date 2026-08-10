using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using WishDem.Admin.Api.Configuration;
using WishDem.Admin.Api.Interfaces;
using WishDem.Admin.Api.Models.Responses;
using WishDem.Cache.Sdk.Services;
using WishDem.Common.Sdk.Exceptions;
using WishDem.Common.Sdk.Responses;
using WishDem.Messaging.Sdk.Abstractions;
using WishDem.Messaging.Sdk.Templates;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Admin.Api.Services;

public class AuthService(
    IRepository<AdminUser> adminUsers,
    ITokenService tokenService,
    IPasswordHasher<AdminUser> passwordHasher,
    ICacheService cache,
    IEmailSender emailSender,
    IOptions<PasswordResetOptions> passwordResetOptions,
    IWebHostEnvironment environment,
    ILogger<AuthService> logger) : IAuthService
{
    private readonly PasswordResetOptions _passwordReset = passwordResetOptions.Value;

    public async Task<IApiResponse<AuthTokenResponse>> LoginAsync(string email, string password, CancellationToken ct = default)
    {
        try
        {
            var normalizedEmail = email.Trim().ToLowerInvariant();
            var user = await adminUsers.FindAsync(u => u.Email == normalizedEmail, ct);

            if (user is null || !user.IsActive || !VerifyPassword(user, password))
                return ApiResponseFactory.Unauthorized<AuthTokenResponse>("Invalid email or password.");

            user.LastLoginAtUtc = DateTime.UtcNow;
            await adminUsers.UpdateAsync(user, ct);

            var response = await IssueResponseAsync(user, ct);
            return response.ToOkApiResponse("Signed in successfully.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[LoginAsync] Failed to log in {Email}", email);
            return ApiResponseFactory.InternalError<AuthTokenResponse>("Failed to sign in.");
        }
    }

    public async Task<IApiResponse<AuthTokenResponse>> RefreshAsync(string refreshToken, CancellationToken ct = default)
    {
        try
        {
            var peeked = await tokenService.PeekRefreshTokenAsync(refreshToken, ct);
            if (peeked is null)
                return ApiResponseFactory.Unauthorized<AuthTokenResponse>("That session has expired. Please sign in again.");

            var user = await adminUsers.GetByIdAsync(peeked.Value.UserId, ct);
            if (user is null)
                return ApiResponseFactory.Unauthorized<AuthTokenResponse>("That session is no longer valid.");

            if (peeked.Value.TokenVersion != user.TokenVersion)
                return ApiResponseFactory.Unauthorized<AuthTokenResponse>("That session has expired. Please sign in again.");

            await tokenService.RevokeRefreshTokenAsync(refreshToken, ct);
            var response = await IssueResponseAsync(user, ct);
            return response.ToOkApiResponse("Session refreshed successfully.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[RefreshAsync] Failed to refresh session");
            return ApiResponseFactory.InternalError<AuthTokenResponse>("Failed to refresh session.");
        }
    }

    public async Task<IApiResponse<bool>> LogoutAsync(string refreshToken, CancellationToken ct = default)
    {
        try
        {
            await tokenService.RevokeRefreshTokenAsync(refreshToken, ct);
            return true.ToOkApiResponse("Logged out successfully.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[LogoutAsync] Failed to log out");
            return ApiResponseFactory.InternalError<bool>("Failed to log out.");
        }
    }

    public async Task<IApiResponse<bool>> ChangePasswordAsync(Guid adminUserId, string currentPassword, string newPassword, CancellationToken ct = default)
    {
        try
        {
            var user = await adminUsers.GetByIdAsync(adminUserId, ct);
            if (user is null)
                return ApiResponseFactory.NotFound<bool>("That admin account could not be found.");

            if (!VerifyPassword(user, currentPassword))
                return ApiResponseFactory.Unauthorized<bool>("Your current password is incorrect.");

            user.PasswordHash = passwordHasher.HashPassword(user, newPassword);
            user.TokenVersion++;
            await adminUsers.UpdateAsync(user, ct);

            return true.ToOkApiResponse("Password changed successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<bool>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[ChangePasswordAsync] Failed to change password for admin {AdminUserId}", adminUserId);
            return ApiResponseFactory.InternalError<bool>("Failed to change password.");
        }
    }

    public async Task<IApiResponse<PasswordResetRequestedResponse>> ForgotPasswordAsync(string email, CancellationToken ct = default)
    {
        try
        {
            var normalizedEmail = email.Trim().ToLowerInvariant();
            var cooldownKey = CooldownKey(normalizedEmail);

            if (await cache.ExistsAsync(cooldownKey))
                return ApiResponseFactory.Conflict<PasswordResetRequestedResponse>("Please wait before requesting another code.");

            // Always behave the same way whether or not the account exists, so this
            // endpoint can't be used to enumerate admin email addresses.
            var user = await adminUsers.FindAsync(u => u.Email == normalizedEmail, ct);

            var code = GenerateCode();
            if (user is not null)
            {
                await cache.SetAsync(ResetCodeKey(normalizedEmail), code, TimeSpan.FromSeconds(_passwordReset.ExpirySeconds));

                var expiryMinutes = _passwordReset.ExpirySeconds / 60;
                var subject = $"{code} is your WishDem admin reset code";
                var textBody = $"Your password reset code is {code}. It expires in {expiryMinutes} minutes.";
                var htmlBody = EmailTemplate.Shell(subject, $"""
                    <h1 style="margin:0 0 14px;font-family:Georgia,'Playfair Display',serif;font-size:26px;font-weight:700;color:#2A1629;">Reset your password</h1>
                    <p style="margin:0;">Hi {EmailTemplate.Encode(user.FullName)}, use this code to reset your WishDem Admin password.</p>
                    {EmailTemplate.CodeBox(code)}
                    <p style="margin:0;font-size:12px;color:rgba(36,29,36,0.6);">This code expires in {expiryMinutes} minutes. If you didn't request this, let a teammate know.</p>
                    """);

                await emailSender.SendAsync(normalizedEmail, subject, textBody, htmlBody, ct);
            }

            await cache.SetAsync(cooldownKey, true, TimeSpan.FromSeconds(_passwordReset.ResendCooldownSeconds));

            var devCode = user is not null && _passwordReset.ReturnCodeInResponse && !environment.IsProduction() ? code : null;
            var result = new PasswordResetRequestedResponse(MaskEmail(normalizedEmail), _passwordReset.ExpirySeconds, devCode);
            return result.ToOkApiResponse("If that account exists, a reset code has been sent.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[ForgotPasswordAsync] Failed to request password reset for {Email}", email);
            return ApiResponseFactory.InternalError<PasswordResetRequestedResponse>("Failed to send a reset code.");
        }
    }

    public async Task<IApiResponse<bool>> ResetPasswordAsync(string email, string code, string newPassword, CancellationToken ct = default)
    {
        try
        {
            var normalizedEmail = email.Trim().ToLowerInvariant();
            var storedCode = await cache.GetAsync<string>(ResetCodeKey(normalizedEmail));

            if (storedCode is null || storedCode != code.Trim())
                return ApiResponseFactory.Unauthorized<bool>("That code is invalid or has expired.");

            var user = await adminUsers.FindAsync(u => u.Email == normalizedEmail, ct);
            if (user is null)
                return ApiResponseFactory.Unauthorized<bool>("That code is invalid or has expired.");

            await cache.RemoveAsync(ResetCodeKey(normalizedEmail));

            user.PasswordHash = passwordHasher.HashPassword(user, newPassword);
            user.TokenVersion++;
            await adminUsers.UpdateAsync(user, ct);

            return true.ToOkApiResponse("Password reset successfully.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[ResetPasswordAsync] Failed to reset password for {Email}", email);
            return ApiResponseFactory.InternalError<bool>("Failed to reset password.");
        }
    }

    private async Task<AuthTokenResponse> IssueResponseAsync(AdminUser user, CancellationToken ct)
    {
        var tokens = await tokenService.IssueTokensAsync(user, ct);
        return new AuthTokenResponse(
            tokens.AccessToken,
            tokens.RefreshToken,
            tokens.AccessTokenExpiresAtUtc,
            new AdminUserResponse(user.Id, user.Email, user.FullName, user.Role));
    }

    private bool VerifyPassword(AdminUser user, string password) =>
        passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password) != PasswordVerificationResult.Failed;

    private static string GenerateCode() => RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");

    private static string MaskEmail(string email)
    {
        var parts = email.Split('@');
        if (parts.Length != 2 || parts[0].Length == 0) return email;
        var visible = parts[0][0];
        return $"{visible}{new string('•', Math.Max(3, parts[0].Length - 1))}@{parts[1]}";
    }

    private static string ResetCodeKey(string email) => $"admin:pwreset:{email}";

    private static string CooldownKey(string email) => $"admin:pwreset:cooldown:{email}";
}
