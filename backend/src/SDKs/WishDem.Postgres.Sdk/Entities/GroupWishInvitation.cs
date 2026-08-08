using WishDem.Common.Sdk.Enums;

namespace WishDem.Postgres.Sdk.Entities;

/// <summary>An invited contributor for a GroupWish. Guests are not required to hold a
/// CustomerUser account — they're identified by an opaque InviteToken shared via link,
/// matching the "guest submits without registering" flow in the customer portal.</summary>
public class GroupWishInvitation : BaseEntity
{
    public Guid GroupWishId { get; set; }
    public GroupWish? GroupWish { get; set; }

    public required string InviteToken { get; set; }
    public required string GuestName { get; set; }
    public string? GuestEmail { get; set; }
    public GroupWishInvitationStatus Status { get; set; } = GroupWishInvitationStatus.Invited;
    public DateTime? RespondedAtUtc { get; set; }
}
