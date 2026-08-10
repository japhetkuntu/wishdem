using WishDem.Admin.Api.Models.Requests;
using WishDem.Admin.Api.Models.Responses;
using WishDem.Common.Sdk.Enums;
using WishDem.Common.Sdk.Responses;

namespace WishDem.Admin.Api.Interfaces;

public interface IModerationService
{
    Task<IApiResponse<PagedResult<ModerationCaseResponse>>> GetAllAsync(int pageIndex, int pageSize, ModerationStatus? status, CancellationToken ct = default);

    Task<IApiResponse<ModerationCaseResponse>> GetByIdAsync(Guid caseId, CancellationToken ct = default);

    Task<IApiResponse<ModerationCaseResponse>> CreateAsync(CreateModerationCaseRequest request, CancellationToken ct = default);

    Task<IApiResponse<ModerationCaseResponse>> DecideAsync(Guid reviewerAdminUserId, Guid caseId, DecideModerationCaseRequest request, CancellationToken ct = default);

    Task<IApiResponse<ModerationCaseResponse>> AssignAsync(Guid adminUserId, Guid caseId, CancellationToken ct = default);
}
