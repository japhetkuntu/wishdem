using WishDem.Common.Sdk.Enums;

namespace WishDem.Postgres.Sdk.Entities;

/// <summary>A single scheduled birthday wish. Both the Customer API (the sender's own
/// wizard) and the Admin API (operations oversight) read and write this same table.</summary>
public class Wish : BaseEntity
{
    public Guid CustomerUserId { get; set; }
    public CustomerUser? CustomerUser { get; set; }

    public string FromName { get; set; } = "You";

    // Recipient
    public required string RecipientName { get; set; }
    public required string RecipientRelationship { get; set; }
    public DateOnly RecipientBirthday { get; set; }
    public TimeOnly DeliveryTime { get; set; }
    public required string RecipientTimezone { get; set; }

    /// <summary>Required for Sms/WhatsApp delivery (the recipient never has a WishDem
    /// account, so this is the only way to reach them for those channels) — optional for
    /// Link, where the customer shares the link themselves.</summary>
    public string? RecipientPhoneNumber { get; set; }

    // Message
    public string Message { get; set; } = string.Empty;
    public AttachmentKind? AttachmentKind { get; set; }
    public string? AttachmentUrl { get; set; }
    public int? AttachmentDurationSeconds { get; set; }

    // Theme + delivery
    public string? ThemeId { get; set; }
    public DeliveryChannel? Channel { get; set; }

    // Lifecycle
    public WishStatus Status { get; set; } = WishStatus.Draft;
    public string PriceLabel { get; set; } = "GH₵1.49";
    public DateTime? SealedAtUtc { get; set; }
    public DateTime? DeliveredAtUtc { get; set; }
    public DateTime? OpenedAtUtc { get; set; }

    /// <summary>Failed-send bookkeeping so a permanently-broken destination (bad number,
    /// provider outage) doesn't get retried every poll cycle forever. Backs off
    /// exponentially and gives up after WishDeliveryProcessor's max-attempts cap.</summary>
    public int DeliveryAttemptCount { get; set; }
    public DateTime? NextDeliveryAttemptAtUtc { get; set; }
}
