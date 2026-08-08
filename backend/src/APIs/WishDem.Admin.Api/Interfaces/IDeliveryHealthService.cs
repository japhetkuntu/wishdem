using WishDem.Admin.Api.Models.Responses;
using WishDem.Common.Sdk.Responses;

namespace WishDem.Admin.Api.Interfaces;

public interface IDeliveryHealthService
{
    Task<IApiResponse<DeliveryHealthResponse>> GetHealthAsync(CancellationToken ct = default);
}
