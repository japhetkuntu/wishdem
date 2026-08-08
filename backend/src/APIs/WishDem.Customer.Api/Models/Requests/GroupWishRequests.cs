using WishDem.Common.Sdk.Enums;

namespace WishDem.Customer.Api.Models.Requests;

public record CreateGroupWishRequest(
    string Title,
    string RecipientName,
    string? Occasion,
    DateOnly? DeliveryDate,
    DateOnly? CollectByDate,
    string? Context,
    string? OrganizerNote,
    List<MemoryFormat> Formats,
    bool NamesVisible);

public record InviteGuestRequest(string GuestName, string? GuestEmail);

public record RespondToInvitationRequest(GroupWishInvitationStatus Status);

public record SaveMemoryRequest(
    MemoryFormat Format,
    string? Title,
    string Body,
    string? WhenWhere,
    string? AttachmentUrl,
    int? AttachmentDurationSeconds);
