using WishDem.Common.Sdk.Responses;
using WishDem.Customer.Api.Models.Requests;
using WishDem.Customer.Api.Models.Responses;

namespace WishDem.Customer.Api.Interfaces;

public interface IGroupWishService
{
    Task<IApiResponse<IReadOnlyList<GroupWishResponse>>> GetMineAsync(Guid organizerId, CancellationToken ct = default);

    Task<IApiResponse<GroupWishResponse>> GetByIdAsync(Guid organizerId, Guid groupWishId, CancellationToken ct = default);

    Task<IApiResponse<GroupWishResponse>> CreateAsync(Guid organizerId, CreateGroupWishRequest request, CancellationToken ct = default);

    Task<IApiResponse<GroupWishInvitationResponse>> InviteAsync(Guid organizerId, Guid groupWishId, InviteGuestRequest request, CancellationToken ct = default);

    Task<IApiResponse<IReadOnlyList<GroupWishInvitationResponse>>> GetInvitationsAsync(Guid organizerId, Guid groupWishId, CancellationToken ct = default);

    Task<IApiResponse<IReadOnlyList<GroupWishMemoryResponse>>> GetMemoriesAsync(Guid organizerId, Guid groupWishId, CancellationToken ct = default);

    Task<IApiResponse<GroupWishResponse>> SealAsync(Guid organizerId, Guid groupWishId, CancellationToken ct = default);

    Task<IApiResponse<bool>> DeleteAsync(Guid organizerId, Guid groupWishId, CancellationToken ct = default);
}

public interface IGroupWishGuestService
{
    Task<IApiResponse<GroupWishInvitationContextResponse>> GetInvitationContextAsync(string inviteToken, CancellationToken ct = default);

    Task<IApiResponse<GroupWishInvitationContextResponse>> RespondAsync(string inviteToken, RespondToInvitationRequest request, CancellationToken ct = default);

    Task<IApiResponse<GroupWishMemoryResponse>> SubmitMemoryAsync(string inviteToken, SaveMemoryRequest request, CancellationToken ct = default);

    Task<IApiResponse<GroupWishMemoryResponse>> UpdateMemoryAsync(string inviteToken, Guid memoryId, SaveMemoryRequest request, CancellationToken ct = default);

    Task<IApiResponse<GroupWishMemoryResponse>> SealMemoryAsync(string inviteToken, Guid memoryId, CancellationToken ct = default);
}

public interface IBirthdayBloomService
{
    Task<IApiResponse<BirthdayBloomResponse>> GetAsync(Guid groupWishId, CancellationToken ct = default);
}
