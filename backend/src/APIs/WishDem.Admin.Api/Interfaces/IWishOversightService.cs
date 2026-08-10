using WishDem.Admin.Api.Models.Responses;
using WishDem.Common.Sdk.Enums;
using WishDem.Common.Sdk.Responses;

namespace WishDem.Admin.Api.Interfaces;

public interface IWishOversightService
{
    Task<IApiResponse<PagedResult<AdminWishResponse>>> GetAllAsync(int pageIndex, int pageSize, WishStatus? status, CancellationToken ct = default);

    Task<IApiResponse<AdminWishResponse>> GetByIdAsync(Guid wishId, CancellationToken ct = default);

    Task<IApiResponse<AdminWishResponse>> UpdateStatusAsync(Guid adminUserId, Guid wishId, WishStatus status, CancellationToken ct = default);

    Task<IApiResponse<bool>> DeleteAsync(Guid adminUserId, Guid wishId, CancellationToken ct = default);

    /// <summary>Placeholder action until a real delivery worker/queue exists: clears delivery
    /// state so the wish re-enters the "due" bucket the next time /api/delivery-health is computed.
    /// Does NOT trigger any real message being sent.</summary>
    Task<IApiResponse<AdminWishResponse>> RedeliverAsync(Guid adminUserId, Guid wishId, CancellationToken ct = default);
}
