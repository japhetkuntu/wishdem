using WishDem.Common.Sdk.Enums;

namespace WishDem.Postgres.Sdk.Entities;

/// <summary>A collaborative wish where multiple invited contributors each add a memory
/// (note/photo/voice/video) before the collected set is sealed and delivered to the
/// recipient as a single "Birthday Bloom" keepsake.</summary>
public class GroupWish : BaseEntity
{
    public Guid OrganizerCustomerUserId { get; set; }
    public CustomerUser? OrganizerCustomerUser { get; set; }

    public required string Title { get; set; }
    public required string RecipientName { get; set; }
    public string? Occasion { get; set; }
    public DateOnly? DeliveryDate { get; set; }
    public DateOnly? CollectByDate { get; set; }
    public string? Context { get; set; }
    public string? OrganizerNote { get; set; }

    /// <summary>Comma-separated MemoryFormat values contributors may choose from
    /// (e.g. "Notes,Photo,Voice") — stored flat rather than as a join table since
    /// this is a small, fixed set configured once at creation.</summary>
    public string Formats { get; set; } = string.Empty;

    public bool NamesVisible { get; set; } = true;
    public GroupWishStatus Status { get; set; } = GroupWishStatus.Collecting;
    public DateTime? SealedAtUtc { get; set; }
    public DateTime? DeliveredAtUtc { get; set; }

    public List<GroupWishInvitation> Invitations { get; set; } = [];
    public List<GroupWishMemory> Memories { get; set; } = [];
}
