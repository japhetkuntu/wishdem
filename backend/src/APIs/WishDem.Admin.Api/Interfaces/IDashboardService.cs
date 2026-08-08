using WishDem.Admin.Api.Models.Responses;
using WishDem.Common.Sdk.Responses;

namespace WishDem.Admin.Api.Interfaces;

public interface IDashboardService
{
    Task<IApiResponse<DashboardOverviewResponse>> GetOverviewAsync(CancellationToken ct = default);
}
