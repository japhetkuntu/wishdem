using System.Security.Cryptography;
using Google.Apis.Auth;
using Microsoft.Extensions.Options;
using WishDem.Cache.Sdk.Services;
using WishDem.Common.Sdk.Exceptions;
using WishDem.Common.Sdk.Responses;
using WishDem.Customer.Api.Configuration;
using WishDem.Customer.Api.Interfaces;
using WishDem.Customer.Api.Models.Responses;
using WishDem.Messaging.Sdk.Abstractions;
using WishDem.Messaging.Sdk.Templates;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Customer.Api.Services;

public class AuthService(
    IRepository<CustomerUser> customerUsers,
    ITokenService tokenService,
    ICacheService cache,
    IEmailSender emailSender,
    IOptions<OtpOptions> otpOptions,
    IOptions<GoogleAuthOptions> googleOptions,
    IWebHostEnvironment environment,
    ILogger<AuthService> logger) : IAuthService
{
    private readonly OtpOptions _otp = otpOptions.Value;

    public async Task<IApiResponse<OtpRequestedResponse>> RequestOtpAsync(string email, CancellationToken ct = default)
    {
        try
        {
            var normalizedEmail = email.Trim().ToLowerInvariant();
            var cooldownKey = CooldownKey(normalizedEmail);

            if (await cache.ExistsAsync(cooldownKey))
                return ApiResponseFactory.Conflict<OtpRequestedResponse>("Please wait before requesting another code.");

            var code = GenerateCode();
            await cache.SetAsync(OtpKey(normalizedEmail), code, TimeSpan.FromSeconds(_otp.ExpirySeconds));
            await cache.SetAsync(cooldownKey, true, TimeSpan.FromSeconds(_otp.ResendCooldownSeconds));
            // A fresh code shouldn't inherit whatever attempt count was left over from a
            // previous one that expired or was abandoned.
            await cache.RemoveAsync(AttemptsKey(normalizedEmail));

            var isNewCustomer = !await customerUsers.ExistsAsync(u => u.Email == normalizedEmail, ct);

            var expiryMinutes = _otp.ExpirySeconds / 60;
            var subject = $"{code} is your WishDem sign-in code";
            var textBody = $"Your one-time code is {code}. It expires in {expiryMinutes} minutes.";
            var htmlBody = EmailTemplate.Shell(subject, $"""
                {EmailTemplate.Eyebrow(isNewCustomer ? "Welcome to WishDem" : "Sign-in code")}
                <h1 style="margin:0 0 14px;font-family:Georgia,'Playfair Display',serif;font-size:28px;font-weight:700;color:#2A1629;line-height:1.15;">{(isNewCustomer ? "Let's get you set up" : "Welcome back")}</h1>
                <p style="margin:0;">{(isNewCustomer
                    ? "Enter this code to finish setting up your account — WishDem will keep your wishes safe until the day they're meant for."
                    : "Enter this code to sign back in and pick up right where you left off.")}</p>
                {EmailTemplate.CodeBox(code, $"Expires in {expiryMinutes} minutes")}
                <p style="margin:0;font-size:12px;color:rgba(36,29,36,0.55);">Didn't request this? You can safely ignore this email — no account changes were made.</p>
                """);

            await emailSender.SendAsync(normalizedEmail, subject, textBody, htmlBody, ct);

            var devCode = _otp.ReturnCodeInResponse && !environment.IsProduction() ? code : null;

            var result = new OtpRequestedResponse(isNewCustomer, MaskEmail(normalizedEmail), _otp.ExpirySeconds, devCode);
            return result.ToOkApiResponse("A one-time code has been sent.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[RequestOtpAsync] Failed to request OTP for {Email}", email);
            return ApiResponseFactory.InternalError<OtpRequestedResponse>("Failed to send a one-time code.");
        }
    }

    public async Task<IApiResponse<AuthTokenResponse>> VerifyOtpAsync(string email, string code, string? name, CancellationToken ct = default)
    {
        try
        {
            var normalizedEmail = email.Trim().ToLowerInvariant();
            var storedCode = await cache.GetAsync<string>(OtpKey(normalizedEmail));

            if (storedCode is null)
                return ApiResponseFactory.Unauthorized<AuthTokenResponse>("That code is invalid or has expired.");

            if (storedCode != code.Trim())
            {
                // A code is only 6 digits (1M combinations) and the request endpoint's rate
                // limit doesn't protect this verify endpoint from unlimited guesses against
                // one already-issued code — so wrong guesses count against a cap, and once
                // it's hit the code itself is invalidated rather than left guessable for the
                // rest of its expiry window.
                var attempts = await cache.IncrementAsync(AttemptsKey(normalizedEmail), TimeSpan.FromSeconds(_otp.ExpirySeconds));
                if (attempts >= _otp.MaxAttempts)
                    await cache.RemoveAsync(OtpKey(normalizedEmail));

                return ApiResponseFactory.Unauthorized<AuthTokenResponse>("That code is invalid or has expired.");
            }

            await cache.RemoveAsync(OtpKey(normalizedEmail));
            await cache.RemoveAsync(AttemptsKey(normalizedEmail));

            var user = await customerUsers.FindAsync(u => u.Email == normalizedEmail, ct);
            if (user is null)
            {
                user = new CustomerUser
                {
                    Email = normalizedEmail,
                    Name = string.IsNullOrWhiteSpace(name) ? normalizedEmail.Split('@')[0] : name.Trim(),
                };
                await customerUsers.AddAsync(user, ct);
            }

            user.LastLoginAtUtc = DateTime.UtcNow;
            await customerUsers.UpdateAsync(user, ct);

            var response = await IssueResponseAsync(user, ct);
            return response.ToOkApiResponse("Signed in successfully.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[VerifyOtpAsync] Failed to verify OTP for {Email}", email);
            return ApiResponseFactory.InternalError<AuthTokenResponse>("Failed to verify the one-time code.");
        }
    }

    public async Task<IApiResponse<AuthTokenResponse>> SignInWithGoogleAsync(string idToken, CancellationToken ct = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(googleOptions.Value.ClientId))
                return ApiResponseFactory.InternalError<AuthTokenResponse>("Google sign-in is not configured on this environment.");

            GoogleJsonWebSignature.Payload payload;
            try
            {
                payload = await GoogleJsonWebSignature.ValidateAsync(idToken, new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = [googleOptions.Value.ClientId],
                });
            }
            catch (InvalidJwtException)
            {
                return ApiResponseFactory.Unauthorized<AuthTokenResponse>("That Google sign-in could not be verified.");
            }

            var user = await customerUsers.FindAsync(u => u.GoogleSubject == payload.Subject || u.Email == payload.Email, ct);
            if (user is null)
            {
                user = new CustomerUser
                {
                    Email = payload.Email,
                    Name = payload.Name ?? payload.Email.Split('@')[0],
                    GoogleSubject = payload.Subject,
                };
                await customerUsers.AddAsync(user, ct);
            }
            else if (user.GoogleSubject is null)
            {
                user.GoogleSubject = payload.Subject;
            }

            user.LastLoginAtUtc = DateTime.UtcNow;
            await customerUsers.UpdateAsync(user, ct);

            var response = await IssueResponseAsync(user, ct);
            return response.ToOkApiResponse("Signed in successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<AuthTokenResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[SignInWithGoogleAsync] Failed to sign in with Google");
            return ApiResponseFactory.InternalError<AuthTokenResponse>("Failed to sign in with Google.");
        }
    }

    public async Task<IApiResponse<AuthTokenResponse>> RefreshAsync(string refreshToken, CancellationToken ct = default)
    {
        try
        {
            var userId = await tokenService.ValidateRefreshTokenAsync(refreshToken, ct);
            if (userId is null)
                return ApiResponseFactory.Unauthorized<AuthTokenResponse>("That session has expired. Please sign in again.");

            var user = await customerUsers.GetByIdAsync(userId.Value, ct);
            if (user is null)
                return ApiResponseFactory.Unauthorized<AuthTokenResponse>("That session is no longer valid.");

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

    private async Task<AuthTokenResponse> IssueResponseAsync(CustomerUser user, CancellationToken ct)
    {
        var tokens = await tokenService.IssueTokensAsync(user, ct);
        return new AuthTokenResponse(
            tokens.AccessToken,
            tokens.RefreshToken,
            tokens.AccessTokenExpiresAtUtc,
            new CustomerUserResponse(user.Id, user.Email, user.Name));
    }

    private static string GenerateCode() => RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");

    private static string MaskEmail(string email)
    {
        var parts = email.Split('@');
        if (parts.Length != 2 || parts[0].Length == 0) return email;
        var visible = parts[0][0];
        return $"{visible}{new string('•', Math.Max(3, parts[0].Length - 1))}@{parts[1]}";
    }

    private static string OtpKey(string email) => $"customer:otp:{email}";

    private static string CooldownKey(string email) => $"customer:otp:cooldown:{email}";

    private static string AttemptsKey(string email) => $"customer:otp:attempts:{email}";
}
