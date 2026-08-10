using WishDem.Admin.Api.Interfaces;
using WishDem.Admin.Api.Models.Requests;
using WishDem.Admin.Api.Models.Responses;
using WishDem.Common.Sdk.Enums;
using WishDem.Common.Sdk.Exceptions;
using WishDem.Common.Sdk.Responses;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Admin.Api.Services;

public class ModerationService(
    IRepository<ModerationCase> cases,
    IRepository<Wish> wishes,
    IRepository<AdminUser> adminUsers,
    IAuditLogService auditLog,
    ILogger<ModerationService> logger) : IModerationService
{
    public async Task<IApiResponse<PagedResult<ModerationCaseResponse>>> GetAllAsync(int pageIndex, int pageSize, ModerationStatus? status, CancellationToken ct = default)
    {
        try
        {
            var page = await cases.GetPagedAsync(
                pageIndex,
                pageSize,
                filter: status.HasValue ? c => c.Status == status.Value : null,
                orderBy: q => q.OrderByDescending(c => c.CreatedAtUtc),
                ct: ct);

            var adminIds = page.Items
                .SelectMany(c => new[] { c.ReviewerAdminUserId, c.AssignedAdminUserId })
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .Distinct()
                .ToList();
            var admins = await adminUsers.FindManyAsync(a => adminIds.Contains(a.Id), ct);
            var adminsById = admins.ToDictionary(a => a.Id);

            var result = new PagedResult<ModerationCaseResponse>
            {
                Items = page.Items
                    .Select(c => ToResponse(
                        c,
                        c.ReviewerAdminUserId.HasValue ? adminsById.GetValueOrDefault(c.ReviewerAdminUserId.Value) : null,
                        c.AssignedAdminUserId.HasValue ? adminsById.GetValueOrDefault(c.AssignedAdminUserId.Value) : null))
                    .ToList(),
                PageIndex = page.PageIndex,
                PageSize = page.PageSize,
                TotalCount = page.TotalCount,
            };

            return result.ToOkApiResponse("Moderation cases retrieved successfully.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[GetAllAsync] Failed to list moderation cases");
            return ApiResponseFactory.InternalError<PagedResult<ModerationCaseResponse>>("Failed to retrieve moderation cases.");
        }
    }

    public async Task<IApiResponse<ModerationCaseResponse>> GetByIdAsync(Guid caseId, CancellationToken ct = default)
    {
        try
        {
            var moderationCase = await GetCaseAsync(caseId, ct);
            var reviewer = moderationCase.ReviewerAdminUserId.HasValue
                ? await adminUsers.GetByIdAsync(moderationCase.ReviewerAdminUserId.Value, ct)
                : null;
            var assignee = moderationCase.AssignedAdminUserId.HasValue
                ? await adminUsers.GetByIdAsync(moderationCase.AssignedAdminUserId.Value, ct)
                : null;
            return ToResponse(moderationCase, reviewer, assignee).ToOkApiResponse("Moderation case retrieved successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<ModerationCaseResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[GetByIdAsync] Failed to get moderation case {CaseId}", caseId);
            return ApiResponseFactory.InternalError<ModerationCaseResponse>("Failed to retrieve moderation case.");
        }
    }

    public async Task<IApiResponse<ModerationCaseResponse>> CreateAsync(CreateModerationCaseRequest request, CancellationToken ct = default)
    {
        try
        {
            var wish = await wishes.GetByIdAsync(request.WishId, ct);
            if (wish is null)
                return ApiResponseFactory.NotFound<ModerationCaseResponse>("That wish could not be found.");

            var moderationCase = new ModerationCase
            {
                WishId = request.WishId,
                Title = request.Title,
                Description = request.Description,
                EvidenceQuote = request.EvidenceQuote,
                ContentType = request.ContentType,
                Severity = request.Severity,
            };

            await cases.AddAsync(moderationCase, ct);
            return ToResponse(moderationCase, null, null).ToCreatedApiResponse("Moderation case created successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<ModerationCaseResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[CreateAsync] Failed to create moderation case for wish {WishId}", request.WishId);
            return ApiResponseFactory.InternalError<ModerationCaseResponse>("Failed to create moderation case.");
        }
    }

    public async Task<IApiResponse<ModerationCaseResponse>> DecideAsync(Guid reviewerAdminUserId, Guid caseId, DecideModerationCaseRequest request, CancellationToken ct = default)
    {
        try
        {
            var moderationCase = await GetCaseAsync(caseId, ct);
            if (moderationCase.Status != ModerationStatus.UnderReview)
                return ApiResponseFactory.Conflict<ModerationCaseResponse>("This case has already been resolved.");

            moderationCase.Decision = request.Decision;
            moderationCase.DecisionReason = request.Reason;
            moderationCase.Status = ModerationStatus.Resolved;
            moderationCase.ReviewerAdminUserId = reviewerAdminUserId;
            moderationCase.DecidedAtUtc = DateTime.UtcNow;
            await cases.UpdateAsync(moderationCase, ct);

            if (request.Decision == ModerationDecision.Removed)
            {
                var wish = await wishes.GetByIdAsync(moderationCase.WishId, ct);
                if (wish is not null) await wishes.RemoveAsync(wish, ct);
            }

            var assignee = moderationCase.AssignedAdminUserId.HasValue
                ? await adminUsers.GetByIdAsync(moderationCase.AssignedAdminUserId.Value, ct)
                : null;
            var reviewer = await adminUsers.GetByIdAsync(reviewerAdminUserId, ct);
            await auditLog.LogAsync(
                reviewerAdminUserId,
                "moderation.decide",
                "ModerationCase",
                moderationCase.Id,
                $"{(request.Decision == ModerationDecision.Removed ? "removed content for" : "approved")} case {moderationCase.Id}: {request.Reason}",
                AuditTag.ContentAccess,
                ct);
            return ToResponse(moderationCase, reviewer, assignee).ToOkApiResponse("Moderation case decided successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<ModerationCaseResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[DecideAsync] Failed to decide moderation case {CaseId}", caseId);
            return ApiResponseFactory.InternalError<ModerationCaseResponse>("Failed to decide moderation case.");
        }
    }

    public async Task<IApiResponse<ModerationCaseResponse>> AssignAsync(Guid adminUserId, Guid caseId, CancellationToken ct = default)
    {
        try
        {
            var moderationCase = await GetCaseAsync(caseId, ct);
            if (moderationCase.Status != ModerationStatus.UnderReview)
                return ApiResponseFactory.Conflict<ModerationCaseResponse>("This case has already been resolved.");

            moderationCase.AssignedAdminUserId = adminUserId;
            await cases.UpdateAsync(moderationCase, ct);

            var assignee = await adminUsers.GetByIdAsync(adminUserId, ct);
            var reviewer = moderationCase.ReviewerAdminUserId.HasValue
                ? await adminUsers.GetByIdAsync(moderationCase.ReviewerAdminUserId.Value, ct)
                : null;
            await auditLog.LogAsync(adminUserId, "moderation.assign", "ModerationCase", moderationCase.Id, $"assigned case {moderationCase.Id} to themselves", ct: ct);
            return ToResponse(moderationCase, reviewer, assignee).ToOkApiResponse("Moderation case assigned successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<ModerationCaseResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[AssignAsync] Failed to assign moderation case {CaseId}", caseId);
            return ApiResponseFactory.InternalError<ModerationCaseResponse>("Failed to assign moderation case.");
        }
    }

    private async Task<ModerationCase> GetCaseAsync(Guid caseId, CancellationToken ct) =>
        await cases.GetByIdAsync(caseId, ct) ?? throw new NotFoundException("That moderation case could not be found.");

    private static ModerationCaseResponse ToResponse(ModerationCase c, AdminUser? reviewer, AdminUser? assignee) => new(
        c.Id,
        c.WishId,
        c.Title,
        c.Description,
        c.EvidenceQuote,
        c.ContentType,
        c.Severity,
        c.Status,
        assignee?.FullName,
        reviewer?.FullName,
        c.Decision,
        c.DecisionReason,
        c.DecidedAtUtc,
        c.CreatedAtUtc);
}
