using WishDem.Common.Sdk.Enums;

namespace WishDem.Postgres.Sdk.Entities;

/// <summary>A single contributor's memory (note/photo/voice/video) within a GroupWish.
/// Sealed once the contributor is done editing; the recipient only sees sealed memories.</summary>
public class GroupWishMemory : BaseEntity
{
    public Guid GroupWishId { get; set; }
    public GroupWish? GroupWish { get; set; }

    public Guid InvitationId { get; set; }
    public GroupWishInvitation? Invitation { get; set; }

    public MemoryFormat Format { get; set; }
    public string? Title { get; set; }
    public string Body { get; set; } = string.Empty;
    public string? WhenWhere { get; set; }
    public string? AttachmentUrl { get; set; }
    public int? AttachmentDurationSeconds { get; set; }
    public bool IsSealed { get; set; }
}
