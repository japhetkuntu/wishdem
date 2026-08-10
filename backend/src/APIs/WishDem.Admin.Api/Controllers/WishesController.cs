using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WishDem.Admin.Api.Common;
using WishDem.Admin.Api.Interfaces;
using WishDem.Admin.Api.Models.Requests;
using WishDem.Common.Sdk.Enums;

namespace WishDem.Admin.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/wishes")]
public class WishesController(IWishOversightService wishOversightService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageIndex = 0,
        [FromQuery] int pageSize = 20,
        [FromQuery] WishStatus? status = null,
        CancellationToken ct = default)
    {
        var response = await wishOversightService.GetAllAsync(pageIndex, pageSize, status, ct);
        return StatusCode(response.Code, response);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var response = await wishOversightService.GetByIdAsync(id, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateWishStatusRequest request, CancellationToken ct)
    {
        var adminUserId = ClaimsReader.GetUserId(User);
        var response = await wishOversightService.UpdateStatusAsync(adminUserId, id, request.Status, ct);
        return StatusCode(response.Code, response);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var adminUserId = ClaimsReader.GetUserId(User);
        var response = await wishOversightService.DeleteAsync(adminUserId, id, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPost("{id:guid}/redeliver")]
    public async Task<IActionResult> Redeliver(Guid id, CancellationToken ct)
    {
        var adminUserId = ClaimsReader.GetUserId(User);
        var response = await wishOversightService.RedeliverAsync(adminUserId, id, ct);
        return StatusCode(response.Code, response);
    }
}
