using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WishDem.Admin.Api.Common;
using WishDem.Admin.Api.Interfaces;
using WishDem.Admin.Api.Models.Requests;
using WishDem.Common.Sdk.Enums;

namespace WishDem.Admin.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/moderation")]
public class ModerationController(IModerationService moderationService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageIndex = 0,
        [FromQuery] int pageSize = 20,
        [FromQuery] ModerationStatus? status = null,
        CancellationToken ct = default)
    {
        var response = await moderationService.GetAllAsync(pageIndex, pageSize, status, ct);
        return StatusCode(response.Code, response);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var response = await moderationService.GetByIdAsync(id, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateModerationCaseRequest request, CancellationToken ct)
    {
        var response = await moderationService.CreateAsync(request, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPost("{id:guid}/decide")]
    public async Task<IActionResult> Decide(Guid id, [FromBody] DecideModerationCaseRequest request, CancellationToken ct)
    {
        var reviewerId = ClaimsReader.GetUserId(User);
        var response = await moderationService.DecideAsync(reviewerId, id, request, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPost("{id:guid}/assign")]
    public async Task<IActionResult> Assign(Guid id, CancellationToken ct)
    {
        var adminUserId = ClaimsReader.GetUserId(User);
        var response = await moderationService.AssignAsync(adminUserId, id, ct);
        return StatusCode(response.Code, response);
    }
}
