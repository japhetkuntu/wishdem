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
