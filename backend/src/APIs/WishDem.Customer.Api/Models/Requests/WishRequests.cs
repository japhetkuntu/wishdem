using WishDem.Common.Sdk.Enums;

namespace WishDem.Customer.Api.Models.Requests;

public record SaveWishRequest(
    string FromName,
    string RecipientName,
    string RecipientRelationship,
    OccasionType Occasion,
    string? OccasionLabel,
    DateOnly RecipientOccasionDate,
    TimeOnly DeliveryTime,
    string RecipientTimezone,
    string? RecipientPhoneNumber,
    string Message,
    AttachmentKind? AttachmentKind,
    string? AttachmentUrl,
    int? AttachmentDurationSeconds,
    string? ThemeId,
    DeliveryChannel? Channel);

public record SealWishRequest(string? PromoCode);

public record RetryDeliveryRequest(string RecipientPhoneNumber);
