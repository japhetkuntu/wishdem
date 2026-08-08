using WishDem.Common.Sdk.Enums;

namespace WishDem.Admin.Api.Models.Requests;

public record CreateModerationCaseRequest(
    Guid WishId,
    string Title,
    string? Description,
    string? EvidenceQuote,
    string? ContentType,
    ModerationSeverity Severity);

public record DecideModerationCaseRequest(ModerationDecision Decision, string Reason);
