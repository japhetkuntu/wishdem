using Microsoft.AspNetCore.Http;
using WishDem.Common.Sdk.Responses;
using WishDem.Customer.Api.Models.Requests;
using WishDem.Customer.Api.Models.Responses;

namespace WishDem.Customer.Api.Interfaces;

public interface IWishService
{
    Task<IApiResponse<PagedResult<WishResponse>>> GetMyWishesAsync(Guid customerUserId, int pageIndex, int pageSize, CancellationToken ct = default);

    /// <summary>How many of today's (UTC) 3-wish creation cap this customer has used —
    /// lets the create wizard show the count before they hit the wall.</summary>
    Task<IApiResponse<DailyWishLimitResponse>> GetDailyLimitAsync(Guid customerUserId, CancellationToken ct = default);

    Task<IApiResponse<WishResponse>> GetByIdAsync(Guid customerUserId, Guid wishId, CancellationToken ct = default);

    Task<IApiResponse<WishResponse>> CreateAsync(Guid customerUserId, SaveWishRequest request, CancellationToken ct = default);

    /// <summary>Unauthenticated: stashes wizard progress in the cache under a fresh id, so a
    /// visitor who hasn't signed in yet can keep going instead of hitting a 401. Never touches
    /// Postgres and never counts against the daily cap — only ClaimDraftAsync does that,
    /// once there's a real customer to attach the wish to.</summary>
    Task<IApiResponse<GuestDraftResponse>> CreateDraftAsync(SaveWishRequest request, CancellationToken ct = default);

    /// <summary>Unauthenticated: overwrites a previously stashed draft as the visitor moves
    /// through later wizard steps (message, theme, delivery channel).</summary>
    Task<IApiResponse<GuestDraftResponse>> UpdateDraftAsync(Guid draftId, SaveWishRequest request, CancellationToken ct = default);

    /// <summary>Unauthenticated: lets the wizard re-hydrate a stashed draft, e.g. after a
    /// page reload while the visitor is still on the login/verify screen.</summary>
    Task<IApiResponse<SaveWishRequest>> GetDraftAsync(Guid draftId, CancellationToken ct = default);

    /// <summary>Authenticated: exchanges a stashed guest draft for a real wish belonging to
    /// the now-signed-in customer, then deletes the cached draft. Goes through the same
    /// daily-limit check as CreateAsync since this is the first point a real customer exists.</summary>
    Task<IApiResponse<WishResponse>> ClaimDraftAsync(Guid customerUserId, Guid draftId, CancellationToken ct = default);

    Task<IApiResponse<WishResponse>> UpdateAsync(Guid customerUserId, Guid wishId, SaveWishRequest request, CancellationToken ct = default);

    Task<IApiResponse<WishResponse>> SealAsync(Guid customerUserId, Guid wishId, SealWishRequest request, CancellationToken ct = default);

    Task<IApiResponse<bool>> DeleteAsync(Guid customerUserId, Guid wishId, CancellationToken ct = default);

    /// <summary>Public, unauthenticated: the wish recipient has no WishDem account, so this
    /// relies on the wish's Guid being unguessable rather than a separate share-token —
    /// matching the trust model already used by the group-wish invite-token endpoints. A
    /// dedicated share-token would be a future hardening step. Message/attachment fields are
    /// blanked out until the wish is Opened — the sealed-envelope ceremony wouldn't mean much
    /// if the content were already sitting in the network response before the recipient
    /// clicks "open". MarkOpenedAsync is what actually reveals it.</summary>
    Task<IApiResponse<WishResponse>> GetPublicAsync(Guid wishId, CancellationToken ct = default);

    /// <summary>Public, unauthenticated: marks a wish as opened by its recipient and returns
    /// the full content — this is the "break the seal" reveal call. Idempotent — calling this
    /// again on an already-opened wish just returns the current (still fully revealed) state.</summary>
    Task<IApiResponse<WishResponse>> MarkOpenedAsync(Guid wishId, CancellationToken ct = default);

    /// <summary>Owner-only: uploads a wish attachment (image/video/voice/gif) to object
    /// storage, returning the URL to store on the wish/memory.</summary>
    Task<IApiResponse<AttachmentUploadResponse>> UploadAttachmentAsync(Guid customerUserId, Guid wishId, IFormFile file, CancellationToken ct = default);
}
