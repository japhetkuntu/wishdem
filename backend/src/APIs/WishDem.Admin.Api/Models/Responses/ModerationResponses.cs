using WishDem.Common.Sdk.Enums;

namespace WishDem.Admin.Api.Models.Responses;

public record ModerationCaseResponse(
    Guid Id,
    Guid WishId,
    string Title,
    string? Description,
    string? EvidenceQuote,
    string? ContentType,
    ModerationSeverity Severity,
    ModerationStatus Status,
    string? ReviewerName,
    ModerationDecision? Decision,
    string? DecisionReason,
    DateTime? DecidedAtUtc,
    DateTime CreatedAtUtc);
