using WishDem.Common.Sdk.Responses;
using WishDem.Customer.Api.Models.Requests;
using WishDem.Customer.Api.Models.Responses;

namespace WishDem.Customer.Api.Interfaces;

public interface ICirclePersonService
{
    Task<IApiResponse<IReadOnlyList<CirclePersonResponse>>> GetMineAsync(Guid customerUserId, CancellationToken ct = default);

    Task<IApiResponse<CirclePersonResponse>> CreateAsync(Guid customerUserId, SaveCirclePersonRequest request, CancellationToken ct = default);

    Task<IApiResponse<CirclePersonResponse>> UpdateAsync(Guid customerUserId, Guid personId, SaveCirclePersonRequest request, CancellationToken ct = default);

    Task<IApiResponse<bool>> DeleteAsync(Guid customerUserId, Guid personId, CancellationToken ct = default);
}
