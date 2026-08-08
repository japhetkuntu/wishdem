using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WishDem.Customer.Api.Common;
using WishDem.Customer.Api.Interfaces;
using WishDem.Customer.Api.Models.Requests;

namespace WishDem.Customer.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/wishes/{wishId:guid}/payments")]
public class PaymentsController(IPaymentService paymentService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Initiate(Guid wishId, [FromBody] InitiatePaymentRequest request, CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await paymentService.InitiateAsync(userId, wishId, request, ct);
        return StatusCode(response.Code, response);
    }

    [HttpGet("latest")]
    public async Task<IActionResult> GetLatest(Guid wishId, CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await paymentService.GetLatestAsync(userId, wishId, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPost("{paymentId:guid}/simulate")]
    public async Task<IActionResult> SimulateOutcome(Guid wishId, Guid paymentId, [FromBody] SimulatePaymentOutcomeRequest request, CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await paymentService.SimulateOutcomeAsync(userId, wishId, paymentId, request, ct);
        return StatusCode(response.Code, response);
    }
}
