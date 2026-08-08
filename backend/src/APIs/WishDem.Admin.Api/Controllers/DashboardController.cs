using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WishDem.Admin.Api.Interfaces;

namespace WishDem.Admin.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard")]
public class DashboardController(IDashboardService dashboardService) : ControllerBase
{
    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview(CancellationToken ct)
    {
        var response = await dashboardService.GetOverviewAsync(ct);
        return StatusCode(response.Code, response);
    }
}
