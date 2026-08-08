using WishDem.Common.Sdk.Enums;

namespace WishDem.Postgres.Sdk.Entities;

/// <summary>An admin content-review case opened against a Wish, either automatically
/// flagged or reported, tracked through to a decision with an auditable reason.</summary>
public class ModerationCase : BaseEntity
{
    public Guid WishId { get; set; }
    public Wish? Wish { get; set; }

    public required string Title { get; set; }
    public string? Description { get; set; }
    public string? EvidenceQuote { get; set; }
    public string? ContentType { get; set; }
    public ModerationSeverity Severity { get; set; } = ModerationSeverity.Medium;
    public ModerationStatus Status { get; set; } = ModerationStatus.UnderReview;

    public Guid? ReviewerAdminUserId { get; set; }
    public AdminUser? ReviewerAdminUser { get; set; }
    public ModerationDecision? Decision { get; set; }
    public string? DecisionReason { get; set; }
    public DateTime? DecidedAtUtc { get; set; }
}
