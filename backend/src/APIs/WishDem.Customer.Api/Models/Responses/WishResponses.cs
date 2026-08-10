using WishDem.Common.Sdk.Enums;

namespace WishDem.Customer.Api.Models.Responses;

public record WishResponse(
    Guid Id,
    string FromName,
    string RecipientName,
    string RecipientRelationship,
    DateOnly RecipientBirthday,
    TimeOnly DeliveryTime,
    string RecipientTimezone,
    string? RecipientPhoneNumber,
    string Message,
    AttachmentKind? AttachmentKind,
    string? AttachmentUrl,
    int? AttachmentDurationSeconds,
    string? ThemeId,
    DeliveryChannel? Channel,
    WishStatus Status,
    string PriceLabel,
    DateTime? SealedAtUtc,
    DateTime? DeliveredAtUtc,
    DateTime? OpenedAtUtc,
    DateTime CreatedAtUtc);

/// <summary>Lets the create wizard show "2 of 3 used today" up front instead of only
/// discovering the cap when the create call itself gets rejected.</summary>
public record DailyWishLimitResponse(int Used, int Max, int Remaining, DateTime ResetsAtUtc);

/// <summary>Returned when an unauthenticated visitor stashes wizard progress before signing
/// in — the frontend holds onto DraftId and exchanges it for a real wish right after
/// login/registration completes, via ClaimDraftAsync.</summary>
public record GuestDraftResponse(Guid DraftId);
