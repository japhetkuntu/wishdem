using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WishDem.Admin.Api.Interfaces;

namespace WishDem.Admin.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/audit-log")]
public class AuditLogController(IAuditLogService auditLogService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageIndex = 0,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var response = await auditLogService.GetAllAsync(pageIndex, pageSize, ct);
        return StatusCode(response.Code, response);
    }
}
