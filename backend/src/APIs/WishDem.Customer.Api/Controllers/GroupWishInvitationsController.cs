using Microsoft.AspNetCore.Mvc;
using WishDem.Customer.Api.Interfaces;
using WishDem.Customer.Api.Models.Requests;

namespace WishDem.Customer.Api.Controllers;

/// <summary>Guest-facing endpoints, reached via an opaque invite-link token rather than a
/// customer account — contributors to a group wish don't need to register.</summary>
[ApiController]
[Route("api/group-wishes/invitations/{token}")]
public class GroupWishInvitationsController(IGroupWishGuestService guestService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetContext(string token, CancellationToken ct)
    {
        var response = await guestService.GetInvitationContextAsync(token, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPost("respond")]
    public async Task<IActionResult> Respond(string token, [FromBody] RespondToInvitationRequest request, CancellationToken ct)
    {
        var response = await guestService.RespondAsync(token, request, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPost("memories")]
    public async Task<IActionResult> SubmitMemory(string token, [FromBody] SaveMemoryRequest request, CancellationToken ct)
    {
        var response = await guestService.SubmitMemoryAsync(token, request, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPut("memories/{memoryId:guid}")]
    public async Task<IActionResult> UpdateMemory(string token, Guid memoryId, [FromBody] SaveMemoryRequest request, CancellationToken ct)
    {
        var response = await guestService.UpdateMemoryAsync(token, memoryId, request, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPost("memories/{memoryId:guid}/seal")]
    public async Task<IActionResult> SealMemory(string token, Guid memoryId, CancellationToken ct)
    {
        var response = await guestService.SealMemoryAsync(token, memoryId, ct);
        return StatusCode(response.Code, response);
    }
}
