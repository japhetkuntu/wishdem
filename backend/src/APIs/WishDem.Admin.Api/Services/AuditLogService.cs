using WishDem.Admin.Api.Interfaces;
using WishDem.Admin.Api.Models.Responses;
using WishDem.Common.Sdk.Enums;
using WishDem.Common.Sdk.Responses;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Admin.Api.Services;

public class AuditLogService(
    IRepository<AdminAuditEvent> events,
    IRepository<AdminUser> adminUsers,
    ILogger<AuditLogService> logger) : IAuditLogService
{
    public async Task<IApiResponse<PagedResult<AuditEventResponse>>> GetAllAsync(int pageIndex, int pageSize, CancellationToken ct = default)
    {
        try
        {
            var page = await events.GetPagedAsync(
                pageIndex,
                pageSize,
                orderBy: q => q.OrderByDescending(e => e.CreatedAtUtc),
                ct: ct);

            var adminIds = page.Items.Select(e => e.AdminUserId).Distinct().ToList();
            var admins = await adminUsers.FindManyAsync(a => adminIds.Contains(a.Id), ct);
            var adminsById = admins.ToDictionary(a => a.Id);

            var result = new PagedResult<AuditEventResponse>
            {
                Items = page.Items
                    .Select(e => new AuditEventResponse(
                        e.Id,
                        adminsById.GetValueOrDefault(e.AdminUserId)?.FullName ?? "Unknown admin",
                        e.Action,
                        e.ResourceType,
                        e.ResourceId,
                        e.Summary,
                        e.Tag,
                        e.CreatedAtUtc))
                    .ToList(),
                PageIndex = page.PageIndex,
                PageSize = page.PageSize,
                TotalCount = page.TotalCount,
            };

            return result.ToOkApiResponse("Audit events retrieved successfully.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[GetAllAsync] Failed to list audit events");
            return ApiResponseFactory.InternalError<PagedResult<AuditEventResponse>>("Failed to retrieve audit events.");
        }
    }

    public async Task LogAsync(Guid adminUserId, string action, string resourceType, Guid? resourceId, string summary, AuditTag tag = AuditTag.General, CancellationToken ct = default)
    {
        try
        {
            await events.AddAsync(new AdminAuditEvent
            {
                AdminUserId = adminUserId,
                Action = action,
                ResourceType = resourceType,
                ResourceId = resourceId,
                Summary = summary,
                Tag = tag,
            }, ct);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[LogAsync] Failed to record audit event for action {Action}", action);
        }
    }
}
