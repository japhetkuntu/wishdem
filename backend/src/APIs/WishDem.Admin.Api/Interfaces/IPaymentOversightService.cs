using WishDem.Admin.Api.Models.Requests;
using WishDem.Admin.Api.Models.Responses;
using WishDem.Common.Sdk.Enums;
using WishDem.Common.Sdk.Responses;

namespace WishDem.Admin.Api.Interfaces;

public interface IPaymentOversightService
{
    Task<IApiResponse<PagedResult<AdminPaymentResponse>>> GetAllAsync(int pageIndex, int pageSize, PaymentStatus? status, CancellationToken ct = default);

    Task<IApiResponse<AdminPaymentResponse>> GetByIdAsync(Guid paymentId, CancellationToken ct = default);

    Task<IApiResponse<AdminPaymentResponse>> RefundAsync(Guid paymentId, RefundPaymentRequest request, CancellationToken ct = default);
}
