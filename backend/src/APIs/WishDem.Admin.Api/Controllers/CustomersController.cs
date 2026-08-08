using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WishDem.Admin.Api.Interfaces;

namespace WishDem.Admin.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/customers")]
public class CustomersController(ICustomerProfileService customerProfileService) : ControllerBase
{
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var response = await customerProfileService.GetProfileAsync(id, ct);
        return StatusCode(response.Code, response);
    }
}
