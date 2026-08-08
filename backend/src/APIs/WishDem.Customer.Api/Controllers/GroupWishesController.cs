using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WishDem.Customer.Api.Common;
using WishDem.Customer.Api.Interfaces;
using WishDem.Customer.Api.Models.Requests;

namespace WishDem.Customer.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/group-wishes")]
public class GroupWishesController(IGroupWishService groupWishService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetMine(CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await groupWishService.GetMineAsync(userId, ct);
        return StatusCode(response.Code, response);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await groupWishService.GetByIdAsync(userId, id, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateGroupWishRequest request, CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await groupWishService.CreateAsync(userId, request, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPost("{id:guid}/invitations")]
    public async Task<IActionResult> Invite(Guid id, [FromBody] InviteGuestRequest request, CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await groupWishService.InviteAsync(userId, id, request, ct);
        return StatusCode(response.Code, response);
    }

    [HttpGet("{id:guid}/invitations")]
    public async Task<IActionResult> GetInvitations(Guid id, CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await groupWishService.GetInvitationsAsync(userId, id, ct);
        return StatusCode(response.Code, response);
    }

    [HttpGet("{id:guid}/memories")]
    public async Task<IActionResult> GetMemories(Guid id, CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await groupWishService.GetMemoriesAsync(userId, id, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPost("{id:guid}/seal")]
    public async Task<IActionResult> Seal(Guid id, CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await groupWishService.SealAsync(userId, id, ct);
        return StatusCode(response.Code, response);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await groupWishService.DeleteAsync(userId, id, ct);
        return StatusCode(response.Code, response);
    }
}
