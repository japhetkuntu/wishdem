using WishDem.Admin.Api.Models.Requests;
using WishDem.Admin.Api.Models.Responses;
using WishDem.Common.Sdk.Enums;
using WishDem.Common.Sdk.Responses;

namespace WishDem.Admin.Api.Interfaces;

public interface IPaymentOversightService
{
    /// <param name="search">Matches the recipient phone number on file, or an exact wish ID.</param>
    Task<IApiResponse<PagedResult<AdminPaymentResponse>>> GetAllAsync(
        int pageIndex, int pageSize, PaymentStatus? status, string? search, CancellationToken ct = default);

    Task<IApiResponse<AdminPaymentResponse>> GetByIdAsync(Guid paymentId, CancellationToken ct = default);

    Task<IApiResponse<AdminPaymentResponse>> RefundAsync(Guid adminUserId, Guid paymentId, RefundPaymentRequest request, CancellationToken ct = default);
}
