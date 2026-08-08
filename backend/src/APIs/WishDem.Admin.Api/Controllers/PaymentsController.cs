using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WishDem.Admin.Api.Interfaces;
using WishDem.Admin.Api.Models.Requests;
using WishDem.Common.Sdk.Enums;

namespace WishDem.Admin.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/payments")]
public class PaymentsController(IPaymentOversightService paymentOversightService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageIndex = 0,
        [FromQuery] int pageSize = 20,
        [FromQuery] PaymentStatus? status = null,
        CancellationToken ct = default)
    {
        var response = await paymentOversightService.GetAllAsync(pageIndex, pageSize, status, ct);
        return StatusCode(response.Code, response);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var response = await paymentOversightService.GetByIdAsync(id, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPost("{id:guid}/refund")]
    public async Task<IActionResult> Refund(Guid id, [FromBody] RefundPaymentRequest request, CancellationToken ct)
    {
        var response = await paymentOversightService.RefundAsync(id, request, ct);
        return StatusCode(response.Code, response);
    }
}
