using WishDem.Common.Sdk.Enums;

namespace WishDem.Postgres.Sdk.Entities;

/// <summary>A record of one admin action, written whenever a service mutates something
/// an operator is accountable for (a refund, a moderation decision, a wish deletion, a
/// team change). Backs the Activity Log page — there is no separate "mock" activity feed.</summary>
public class AdminAuditEvent : BaseEntity
{
    public Guid AdminUserId { get; set; }
    public AdminUser? AdminUser { get; set; }

    /// <summary>A short machine-readable action code, e.g. "wish.redeliver", "payment.refund".</summary>
    public required string Action { get; set; }

    public required string ResourceType { get; set; }
    public Guid? ResourceId { get; set; }

    /// <summary>The human-readable line shown in the activity log, e.g.
    /// "retried delivery DLV-90411 for WD-10482".</summary>
    public required string Summary { get; set; }

    public AuditTag Tag { get; set; } = AuditTag.General;
}
