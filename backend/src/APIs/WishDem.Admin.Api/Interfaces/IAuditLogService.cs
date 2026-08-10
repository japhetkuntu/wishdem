using WishDem.Admin.Api.Models.Responses;
using WishDem.Common.Sdk.Enums;
using WishDem.Common.Sdk.Responses;

namespace WishDem.Admin.Api.Interfaces;

public interface IAuditLogService
{
    Task<IApiResponse<PagedResult<AuditEventResponse>>> GetAllAsync(int pageIndex, int pageSize, CancellationToken ct = default);

    /// <summary>Fire-and-record: called by other admin services right after they complete an
    /// action worth being accountable for. Swallows its own failures (logged, not thrown) so a
    /// broken audit write never blocks the real action that triggered it.</summary>
    Task LogAsync(Guid adminUserId, string action, string resourceType, Guid? resourceId, string summary, AuditTag tag = AuditTag.General, CancellationToken ct = default);
}
