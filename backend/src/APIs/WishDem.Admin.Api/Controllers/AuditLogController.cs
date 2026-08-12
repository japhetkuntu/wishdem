using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WishDem.Admin.Api.Interfaces;
using WishDem.Common.Sdk.Enums;

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
        [FromQuery] Guid? adminUserId = null,
        [FromQuery] AuditTag[]? tags = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        var response = await auditLogService.GetAllAsync(pageIndex, pageSize, adminUserId, tags, search, ct);
        return StatusCode(response.Code, response);
    }
}
