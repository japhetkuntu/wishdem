using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WishDem.Admin.Api.Common;
using WishDem.Admin.Api.Interfaces;
using WishDem.Admin.Api.Models.Requests;

namespace WishDem.Admin.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/admin-users")]
public class AdminUsersController(IAdminUserService adminUserService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var response = await adminUserService.ListAsync(ct);
        return StatusCode(response.Code, response);
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Invite([FromBody] InviteAdminUserRequest request, CancellationToken ct)
    {
        var actingAdminUserId = ClaimsReader.GetUserId(User);
        var response = await adminUserService.InviteAsync(actingAdminUserId, request, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPost("{id:guid}/resend-invite")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> ResendInvite(Guid id, CancellationToken ct)
    {
        var actingAdminUserId = ClaimsReader.GetUserId(User);
        var response = await adminUserService.ResendInviteAsync(actingAdminUserId, id, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPost("{id:guid}/deactivate")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        var actingAdminUserId = ClaimsReader.GetUserId(User);
        var response = await adminUserService.DeactivateAsync(actingAdminUserId, id, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPost("{id:guid}/reactivate")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> Reactivate(Guid id, CancellationToken ct)
    {
        var actingAdminUserId = ClaimsReader.GetUserId(User);
        var response = await adminUserService.ReactivateAsync(actingAdminUserId, id, ct);
        return StatusCode(response.Code, response);
    }
}
