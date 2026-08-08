namespace WishDem.Customer.Api.Models.Responses;

public enum CalendarEventKind
{
    WishDelivery,
    Birthday,
    GroupWishDeadline,
}

public record CalendarEventResponse(
    Guid SourceId,
    CalendarEventKind Kind,
    DateOnly Date,
    string Title,
    string? Description);
