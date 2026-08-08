using WishDem.Common.Sdk.Responses;
using WishDem.Customer.Api.Models.Requests;
using WishDem.Customer.Api.Models.Responses;

namespace WishDem.Customer.Api.Interfaces;

public interface IProfileService
{
    Task<IApiResponse<ProfileResponse>> GetAsync(Guid customerUserId, CancellationToken ct = default);

    Task<IApiResponse<ProfileResponse>> UpdateAsync(Guid customerUserId, UpdateProfileRequest request, CancellationToken ct = default);
}
