using WishDem.Admin.Api.Models.Requests;
using WishDem.Admin.Api.Models.Responses;
using WishDem.Common.Sdk.Enums;
using WishDem.Common.Sdk.Responses;

namespace WishDem.Admin.Api.Interfaces;

public interface IModerationService
{
    /// <param name="search">Case-insensitive match against the case title or description.</param>
    /// <param name="assignedAdminUserId">Restricts to cases assigned to this admin — backs
    /// the "assigned to me" view without the caller filtering a fetched batch itself.</param>
    Task<IApiResponse<PagedResult<ModerationCaseResponse>>> GetAllAsync(
        int pageIndex, int pageSize, ModerationStatus? status, ModerationSeverity[]? severity,
        Guid? assignedAdminUserId, string? search, CancellationToken ct = default);

    Task<IApiResponse<ModerationCaseResponse>> GetByIdAsync(Guid caseId, CancellationToken ct = default);

    Task<IApiResponse<ModerationCaseResponse>> CreateAsync(CreateModerationCaseRequest request, CancellationToken ct = default);

    Task<IApiResponse<ModerationCaseResponse>> DecideAsync(Guid reviewerAdminUserId, Guid caseId, DecideModerationCaseRequest request, CancellationToken ct = default);

    Task<IApiResponse<ModerationCaseResponse>> AssignAsync(Guid adminUserId, Guid caseId, CancellationToken ct = default);
}
