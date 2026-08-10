using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity;
using WishDem.Admin.Api.Interfaces;
using WishDem.Admin.Api.Models.Requests;
using WishDem.Admin.Api.Models.Responses;
using WishDem.Common.Sdk.Enums;
using WishDem.Common.Sdk.Exceptions;
using WishDem.Common.Sdk.Responses;
using WishDem.Messaging.Sdk.Abstractions;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Admin.Api.Services;

public class AdminUserService(
    IRepository<AdminUser> adminUsers,
    IPasswordHasher<AdminUser> passwordHasher,
    IEmailSender emailSender,
    IAuditLogService auditLog,
    ILogger<AdminUserService> logger) : IAdminUserService
{
    public async Task<IApiResponse<IReadOnlyList<TeamMemberResponse>>> ListAsync(CancellationToken ct = default)
    {
        try
        {
            var all = await adminUsers.FindManyAsync(_ => true, ct);
            var result = all
                .OrderBy(a => a.FullName)
                .Select(ToResponse)
                .ToList() as IReadOnlyList<TeamMemberResponse>;
            return result.ToOkApiResponse("Team members retrieved successfully.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[ListAsync] Failed to list admin users");
            return ApiResponseFactory.InternalError<IReadOnlyList<TeamMemberResponse>>("Failed to retrieve team members.");
        }
    }

    public async Task<IApiResponse<TeamMemberResponse>> InviteAsync(Guid invitedByAdminUserId, InviteAdminUserRequest request, CancellationToken ct = default)
    {
        try
        {
            var normalizedEmail = request.Email.Trim().ToLowerInvariant();
            if (await adminUsers.ExistsAsync(u => u.Email == normalizedEmail, ct))
                return ApiResponseFactory.Conflict<TeamMemberResponse>("Someone with that email is already on the team.");

            var tempPassword = GenerateTempPassword();
            var user = new AdminUser
            {
                Email = normalizedEmail,
                FullName = request.FullName,
                Role = request.Role,
                PasswordHash = string.Empty,
            };
            user.PasswordHash = passwordHasher.HashPassword(user, tempPassword);

            await adminUsers.AddAsync(user, ct);
            await SendInviteEmailAsync(normalizedEmail, request.FullName, tempPassword, ct);
            await auditLog.LogAsync(invitedByAdminUserId, "admin_user.invite", "AdminUser", user.Id, $"invited {user.Email} to the team", AuditTag.Security, ct);

            return ToResponse(user).ToCreatedApiResponse("Team member invited successfully.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[InviteAsync] Failed to invite admin user {Email}", request.Email);
            return ApiResponseFactory.InternalError<TeamMemberResponse>("Failed to invite team member.");
        }
    }

    public async Task<IApiResponse<TeamMemberResponse>> ResendInviteAsync(Guid actingAdminUserId, Guid targetAdminUserId, CancellationToken ct = default)
    {
        try
        {
            var user = await GetUserAsync(targetAdminUserId, ct);
            if (user.LastLoginAtUtc is not null)
                return ApiResponseFactory.Conflict<TeamMemberResponse>("This person has already signed in — there's no pending invitation to resend.");

            var tempPassword = GenerateTempPassword();
            user.PasswordHash = passwordHasher.HashPassword(user, tempPassword);
            await adminUsers.UpdateAsync(user, ct);
            await SendInviteEmailAsync(user.Email, user.FullName, tempPassword, ct);
            await auditLog.LogAsync(actingAdminUserId, "admin_user.resend_invite", "AdminUser", user.Id, $"resent the invitation to {user.Email}", AuditTag.Security, ct);

            return ToResponse(user).ToOkApiResponse("Invitation resent successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<TeamMemberResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[ResendInviteAsync] Failed to resend invite for {AdminUserId}", targetAdminUserId);
            return ApiResponseFactory.InternalError<TeamMemberResponse>("Failed to resend invitation.");
        }
    }

    public async Task<IApiResponse<TeamMemberResponse>> DeactivateAsync(Guid actingAdminUserId, Guid targetAdminUserId, CancellationToken ct = default)
    {
        try
        {
            if (actingAdminUserId == targetAdminUserId)
                return ApiResponseFactory.Conflict<TeamMemberResponse>("You can't deactivate your own account.");

            var user = await GetUserAsync(targetAdminUserId, ct);
            user.IsActive = false;
            user.TokenVersion++;
            await adminUsers.UpdateAsync(user, ct);
            await auditLog.LogAsync(actingAdminUserId, "admin_user.deactivate", "AdminUser", user.Id, $"deactivated {user.Email}", AuditTag.Security, ct);

            return ToResponse(user).ToOkApiResponse("Team member deactivated successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<TeamMemberResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[DeactivateAsync] Failed to deactivate {AdminUserId}", targetAdminUserId);
            return ApiResponseFactory.InternalError<TeamMemberResponse>("Failed to deactivate team member.");
        }
    }

    public async Task<IApiResponse<TeamMemberResponse>> ReactivateAsync(Guid actingAdminUserId, Guid targetAdminUserId, CancellationToken ct = default)
    {
        try
        {
            var user = await GetUserAsync(targetAdminUserId, ct);
            user.IsActive = true;
            await adminUsers.UpdateAsync(user, ct);
            await auditLog.LogAsync(actingAdminUserId, "admin_user.reactivate", "AdminUser", user.Id, $"reactivated {user.Email}", AuditTag.Security, ct);

            return ToResponse(user).ToOkApiResponse("Team member reactivated successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<TeamMemberResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[ReactivateAsync] Failed to reactivate {AdminUserId}", targetAdminUserId);
            return ApiResponseFactory.InternalError<TeamMemberResponse>("Failed to reactivate team member.");
        }
    }

    private async Task<AdminUser> GetUserAsync(Guid adminUserId, CancellationToken ct) =>
        await adminUsers.GetByIdAsync(adminUserId, ct) ?? throw new NotFoundException("That team member could not be found.");

    private Task SendInviteEmailAsync(string email, string fullName, string tempPassword, CancellationToken ct) =>
        emailSender.SendAsync(
            email,
            "You've been invited to WishDem Admin",
            $"Hi {fullName}, you've been added to the WishDem operations workspace. " +
            $"Sign in with {email} and the temporary password {tempPassword} — you'll be asked to change it.",
            ct);

    private static string GenerateTempPassword()
    {
        var bytes = RandomNumberGenerator.GetBytes(18);
        return $"Wd-{Convert.ToBase64String(bytes).Replace("+", "A").Replace("/", "B").Replace("=", "")}";
    }

    private static TeamMemberResponse ToResponse(AdminUser u) => new(
        u.Id,
        u.Email,
        u.FullName,
        u.Role,
        u.IsActive,
        u.LastLoginAtUtc,
        u.CreatedAtUtc);
}
