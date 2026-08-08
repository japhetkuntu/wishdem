using WishDem.Admin.Api.Models.Responses;
using WishDem.Common.Sdk.Responses;

namespace WishDem.Admin.Api.Interfaces;

public interface ICustomerProfileService
{
    Task<IApiResponse<CustomerProfileResponse>> GetProfileAsync(Guid customerUserId, CancellationToken ct = default);
}
