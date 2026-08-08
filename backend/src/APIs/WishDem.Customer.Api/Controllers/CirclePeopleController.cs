using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WishDem.Customer.Api.Common;
using WishDem.Customer.Api.Interfaces;
using WishDem.Customer.Api.Models.Requests;

namespace WishDem.Customer.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/circle")]
public class CirclePeopleController(ICirclePersonService circlePersonService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetMine(CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await circlePersonService.GetMineAsync(userId, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveCirclePersonRequest request, CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await circlePersonService.CreateAsync(userId, request, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] SaveCirclePersonRequest request, CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await circlePersonService.UpdateAsync(userId, id, request, ct);
        return StatusCode(response.Code, response);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await circlePersonService.DeleteAsync(userId, id, ct);
        return StatusCode(response.Code, response);
    }
}
