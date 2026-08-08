using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WishDem.Customer.Api.Common;
using WishDem.Customer.Api.Interfaces;
using WishDem.Customer.Api.Models.Requests;

namespace WishDem.Customer.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/profile")]
public class ProfileController(IProfileService profileService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await profileService.GetAsync(userId, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPatch]
    public async Task<IActionResult> Update([FromBody] UpdateProfileRequest request, CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await profileService.UpdateAsync(userId, request, ct);
        return StatusCode(response.Code, response);
    }
}
