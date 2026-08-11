namespace WishDem.Common.Sdk.Enums;

public enum WishStatus
{
    Draft = 0,
    Sealed = 1,
    Delivered = 2,
    Opened = 3,
}

/// <summary>What the wish marks. Birthday/Anniversary recur every year on the same
/// month+day (see WishDeliveryTiming); everything else targets the exact stored date
/// once and doesn't get recomputed into a future year.</summary>
public enum OccasionType
{
    Birthday = 0,
    Anniversary = 1,
    Congratulations = 2,
    ThankYou = 3,
    JustBecause = 4,
    Other = 5,
}

public enum DeliveryChannel
{
    WhatsApp = 0,
    Sms = 1,
    Link = 2,
}

public enum AttachmentKind
{
    Gif = 0,
    Image = 1,
    Video = 2,
    Voice = 3,
}

public enum PaymentStatus
{
    Pending = 0,
    Succeeded = 1,
    Failed = 2,
    Reversed = 3,
    RefundPending = 4,
}

public enum PaymentProvider
{
    Mtn = 0,
    Telecel = 1,
    AirtelTigo = 2,
}

public enum CircleGroup
{
    Family = 0,
    Friends = 1,
    Work = 2,
}

public enum ModerationStatus
{
    UnderReview = 0,
    Resolved = 1,
}

public enum ModerationSeverity
{
    Info = 0,
    Medium = 1,
    High = 2,
    Critical = 3,
}

public enum ModerationDecision
{
    Approved = 0,
    Removed = 1,
}

public enum GroupWishStatus
{
    Collecting = 0,
    Sealed = 1,
    Delivered = 2,
}

public enum GroupWishInvitationStatus
{
    Invited = 0,
    Joined = 1,
    Declined = 2,
    NotNow = 3,
}

public enum MemoryFormat
{
    Notes = 0,
    Photo = 1,
    Voice = 2,
    Video = 3,
}
