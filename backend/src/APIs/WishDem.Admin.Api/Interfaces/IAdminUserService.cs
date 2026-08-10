using WishDem.Admin.Api.Models.Requests;
using WishDem.Admin.Api.Models.Responses;
using WishDem.Common.Sdk.Responses;

namespace WishDem.Admin.Api.Interfaces;

public interface IAdminUserService
{
    Task<IApiResponse<IReadOnlyList<TeamMemberResponse>>> ListAsync(CancellationToken ct = default);

    /// <summary>Creates a real, immediately-usable admin account with a generated temporary
    /// password and emails it to the invitee — there is no separate pending-invitation state;
    /// an account that hasn't logged in yet (LastLoginAtUtc is null) simply displays as "invited".</summary>
    Task<IApiResponse<TeamMemberResponse>> InviteAsync(Guid invitedByAdminUserId, InviteAdminUserRequest request, CancellationToken ct = default);

    Task<IApiResponse<TeamMemberResponse>> ResendInviteAsync(Guid actingAdminUserId, Guid targetAdminUserId, CancellationToken ct = default);

    Task<IApiResponse<TeamMemberResponse>> DeactivateAsync(Guid actingAdminUserId, Guid targetAdminUserId, CancellationToken ct = default);

    Task<IApiResponse<TeamMemberResponse>> ReactivateAsync(Guid actingAdminUserId, Guid targetAdminUserId, CancellationToken ct = default);
}
