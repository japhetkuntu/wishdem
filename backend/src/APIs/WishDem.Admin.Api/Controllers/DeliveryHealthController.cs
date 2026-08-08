using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WishDem.Admin.Api.Interfaces;

namespace WishDem.Admin.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/delivery-health")]
public class DeliveryHealthController(IDeliveryHealthService deliveryHealthService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var response = await deliveryHealthService.GetHealthAsync(ct);
        return StatusCode(response.Code, response);
    }
}
