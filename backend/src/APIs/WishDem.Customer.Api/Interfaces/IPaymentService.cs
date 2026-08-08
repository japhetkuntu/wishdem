using WishDem.Common.Sdk.Responses;
using WishDem.Customer.Api.Models.Requests;
using WishDem.Customer.Api.Models.Responses;

namespace WishDem.Customer.Api.Interfaces;

public interface IPaymentService
{
    Task<IApiResponse<PaymentResponse>> InitiateAsync(Guid customerUserId, Guid wishId, InitiatePaymentRequest request, CancellationToken ct = default);

    Task<IApiResponse<PaymentResponse>> GetLatestAsync(Guid customerUserId, Guid wishId, CancellationToken ct = default);

    Task<IApiResponse<PaymentResponse>> SimulateOutcomeAsync(Guid customerUserId, Guid wishId, Guid paymentId, SimulatePaymentOutcomeRequest request, CancellationToken ct = default);
}
