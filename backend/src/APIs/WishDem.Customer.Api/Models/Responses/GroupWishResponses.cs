using WishDem.Common.Sdk.Enums;

namespace WishDem.Customer.Api.Models.Responses;

public record GroupWishResponse(
    Guid Id,
    string Title,
    string RecipientName,
    string? Occasion,
    DateOnly? DeliveryDate,
    DateOnly? CollectByDate,
    string? Context,
    string? OrganizerNote,
    List<MemoryFormat> Formats,
    bool NamesVisible,
    GroupWishStatus Status,
    DateTime? SealedAtUtc,
    DateTime? DeliveredAtUtc,
    DateTime CreatedAtUtc,
    int InvitedCount,
    int JoinedCount,
    int DeclinedCount,
    int MemoriesCount);

public record GroupWishInvitationResponse(
    Guid Id,
    string InviteToken,
    string GuestName,
    string? GuestEmail,
    GroupWishInvitationStatus Status,
    DateTime? RespondedAtUtc,
    DateTime CreatedAtUtc);

/// <summary>What a guest sees when opening their invite link — enough context to decide
/// whether to join, without exposing the organizer's full dashboard.</summary>
public record GroupWishInvitationContextResponse(
    string InviteToken,
    string Title,
    string InviterName,
    string RecipientName,
    string? Occasion,
    DateOnly? DeliveryDate,
    DateOnly? CollectByDate,
    List<MemoryFormat> Formats,
    string GuestName,
    GroupWishInvitationStatus Status,
    string? OrganizerNote);

public record GroupWishMemoryResponse(
    Guid Id,
    Guid InvitationId,
    MemoryFormat Format,
    string? Title,
    string Body,
    string? WhenWhere,
    string? AttachmentUrl,
    int? AttachmentDurationSeconds,
    bool IsSealed,
    string ContributorLabel,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc);

/// <summary>The sealed keepsake collection the recipient opens once the group wish
/// has been delivered.</summary>
public record BirthdayBloomResponse(
    Guid GroupWishId,
    string RecipientName,
    DateOnly? DeliveryDate,
    string OrganizerName,
    string? OrganizerNote,
    List<GroupWishMemoryResponse> Memories);
