using WishDem.Admin.Api.Models.Responses;
using WishDem.Common.Sdk.Enums;
using WishDem.Common.Sdk.Responses;

namespace WishDem.Admin.Api.Interfaces;

public interface IWishOversightService
{
    /// <param name="search">Case-insensitive match against wish ID, sender name, recipient
    /// name, or recipient phone number — filtering happens here, not in the admin UI.</param>
    /// <param name="struggling">When true, only wishes that have crossed the "struggling"
    /// delivery-attempt threshold (see WishDeliveryTiming.StruggledDeliveryAttempts).</param>
    Task<IApiResponse<PagedResult<AdminWishResponse>>> GetAllAsync(
        int pageIndex, int pageSize, WishStatus? status, string? search, bool? struggling, CancellationToken ct = default);

    Task<IApiResponse<AdminWishResponse>> GetByIdAsync(Guid wishId, CancellationToken ct = default);

    Task<IApiResponse<AdminWishResponse>> UpdateStatusAsync(Guid adminUserId, Guid wishId, WishStatus status, CancellationToken ct = default);

    Task<IApiResponse<bool>> DeleteAsync(Guid adminUserId, Guid wishId, CancellationToken ct = default);

    /// <summary>Resets a wish back to Sealed with its delivery backoff cleared, so the
    /// dispatch worker picks it up again on its next poll.</summary>
    Task<IApiResponse<AdminWishResponse>> RedeliverAsync(Guid adminUserId, Guid wishId, CancellationToken ct = default);
}
