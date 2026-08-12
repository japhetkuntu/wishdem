using Microsoft.EntityFrameworkCore;
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
    public async Task<IApiResponse<PagedResult<AuditEventResponse>>> GetAllAsync(
        int pageIndex, int pageSize, Guid? adminUserId, AuditTag[]? tags, string? search, CancellationToken ct = default)
    {
        try
        {
            var query = events.GetQueryable();

            if (adminUserId.HasValue) query = query.Where(e => e.AdminUserId == adminUserId.Value);
            if (tags is { Length: > 0 }) query = query.Where(e => tags.Contains(e.Tag));

            var trimmedSearch = search?.Trim();
            if (!string.IsNullOrEmpty(trimmedSearch))
                query = query.Where(e => EF.Functions.ILike(e.Summary, $"%{trimmedSearch}%"));

            var totalCount = query.Count();
            var items = query
                .OrderByDescending(e => e.CreatedAtUtc)
                .Skip(pageIndex * pageSize)
                .Take(pageSize)
                .ToList();

            var adminIds = items.Select(e => e.AdminUserId).Distinct().ToList();
            var admins = await adminUsers.FindManyAsync(a => adminIds.Contains(a.Id), ct);
            var adminsById = admins.ToDictionary(a => a.Id);

            var result = new PagedResult<AuditEventResponse>
            {
                Items = items
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
                PageIndex = pageIndex,
                PageSize = pageSize,
                TotalCount = totalCount,
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
