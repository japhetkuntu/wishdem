using WishDem.Common.Sdk.Enums;

namespace WishDem.Admin.Api.Models.Responses;

public record AdminWishResponse(
    Guid Id,
    Guid CustomerUserId,
    string CustomerEmail,
    string CustomerName,
    string FromName,
    string RecipientName,
    string RecipientRelationship,
    string? RecipientPhoneNumber,
    OccasionType Occasion,
    string? OccasionLabel,
    DateOnly RecipientOccasionDate,
    DeliveryChannel? Channel,
    WishStatus Status,
    string PriceLabel,
    DateTime? SealedAtUtc,
    DateTime? DeliveredAtUtc,
    DateTime? OpenedAtUtc,
    DateTime CreatedAtUtc);
