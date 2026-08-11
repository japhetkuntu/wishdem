using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using WishDem.Customer.Api.Common;
using WishDem.Customer.Api.Interfaces;
using WishDem.Customer.Api.Models.Requests;

namespace WishDem.Customer.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/wishes")]
public class WishesController(IWishService wishService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetMine([FromQuery] int pageIndex = 0, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await wishService.GetMyWishesAsync(userId, pageIndex, pageSize, ct);
        return StatusCode(response.Code, response);
    }

    /// <summary>Lets the create wizard show "2 of 3 used today" before the sender starts
    /// filling out the form, rather than only discovering the cap on submit.</summary>
    [HttpGet("daily-limit")]
    public async Task<IActionResult> GetDailyLimit(CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await wishService.GetDailyLimitAsync(userId, ct);
        return StatusCode(response.Code, response);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await wishService.GetByIdAsync(userId, id, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveWishRequest request, CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await wishService.CreateAsync(userId, request, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] SaveWishRequest request, CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await wishService.UpdateAsync(userId, id, request, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPost("{id:guid}/seal")]
    public async Task<IActionResult> Seal(Guid id, [FromBody] SealWishRequest request, CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await wishService.SealAsync(userId, id, request, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPost("{id:guid}/retry-delivery")]
    public async Task<IActionResult> RetryDelivery(Guid id, [FromBody] RetryDeliveryRequest request, CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await wishService.RetryDeliveryAsync(userId, id, request, ct);
        return StatusCode(response.Code, response);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await wishService.DeleteAsync(userId, id, ct);
        return StatusCode(response.Code, response);
    }

    /// <summary>Public: lets a visitor who hasn't signed in yet start the create wizard
    /// instead of hitting a 401 on the very first step. The recipient/message/theme/delivery
    /// fields are cached under a fresh id rather than written to Postgres — nothing becomes a
    /// real wish (and nothing counts against the daily cap) until ClaimDraft runs right after
    /// they log in or register.</summary>
    [AllowAnonymous]
    [HttpPost("drafts")]
    public async Task<IActionResult> CreateDraft([FromBody] SaveWishRequest request, CancellationToken ct)
    {
        var response = await wishService.CreateDraftAsync(request, ct);
        return StatusCode(response.Code, response);
    }

    /// <summary>Public: overwrites a previously stashed draft as the visitor moves through
    /// later wizard steps while still signed out.</summary>
    [AllowAnonymous]
    [HttpPut("drafts/{draftId:guid}")]
    public async Task<IActionResult> UpdateDraft(Guid draftId, [FromBody] SaveWishRequest request, CancellationToken ct)
    {
        var response = await wishService.UpdateDraftAsync(draftId, request, ct);
        return StatusCode(response.Code, response);
    }

    /// <summary>Public: re-hydrates a stashed draft, e.g. after a page reload while the
    /// visitor is still on the login/verify screen.</summary>
    [AllowAnonymous]
    [HttpGet("drafts/{draftId:guid}")]
    public async Task<IActionResult> GetDraft(Guid draftId, CancellationToken ct)
    {
        var response = await wishService.GetDraftAsync(draftId, ct);
        return StatusCode(response.Code, response);
    }

    /// <summary>Requires auth (inherits the controller's [Authorize]): exchanges a stashed
    /// guest draft for a real wish belonging to the now-signed-in customer — this is what the
    /// frontend calls immediately after login/registration completes to pick the flow back up.</summary>
    [HttpPost("drafts/{draftId:guid}/claim")]
    public async Task<IActionResult> ClaimDraft(Guid draftId, CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await wishService.ClaimDraftAsync(userId, draftId, ct);
        return StatusCode(response.Code, response);
    }

    /// <summary>Public: the recipient opens this link without needing a WishDem account.
    /// Relies on the wish's Guid being unguessable rather than a separate share-token —
    /// matching the trust model already used by the group-wish invite-token endpoints. A
    /// dedicated share-token would be a future hardening step.</summary>
    [AllowAnonymous]
    [HttpGet("public/{id:guid}")]
    public async Task<IActionResult> GetPublic(Guid id, CancellationToken ct)
    {
        var response = await wishService.GetPublicAsync(id, ct);
        return StatusCode(response.Code, response);
    }

    /// <summary>Public: marks the wish as opened by its recipient. Idempotent.</summary>
    [AllowAnonymous]
    [HttpPost("public/{id:guid}/mark-opened")]
    public async Task<IActionResult> MarkOpened(Guid id, CancellationToken ct)
    {
        var response = await wishService.MarkOpenedAsync(id, ct);
        return StatusCode(response.Code, response);
    }

    /// <summary>Owner-only: uploads a wish attachment (image/video/voice/gif) to object
    /// storage (DigitalOcean Spaces in production, MinIO locally).</summary>
    [HttpPost("{id:guid}/upload-attachment")]
    public async Task<IActionResult> UploadAttachment(Guid id, IFormFile file, CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await wishService.UploadAttachmentAsync(userId, id, file, ct);
        return StatusCode(response.Code, response);
    }
}
