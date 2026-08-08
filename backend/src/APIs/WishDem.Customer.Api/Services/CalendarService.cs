using WishDem.Common.Sdk.Enums;
using WishDem.Common.Sdk.Responses;
using WishDem.Customer.Api.Interfaces;
using WishDem.Customer.Api.Models.Responses;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Customer.Api.Services;

/// <summary>Aggregates upcoming calendar events from the customer's own data rather than
/// storing a separate events table — a "calendar" is just a view over Wishes, CirclePeople
/// birthdays, and GroupWish collection deadlines.</summary>
public class CalendarService(
    IRepository<Wish> wishes,
    IRepository<CirclePerson> circlePeople,
    IRepository<GroupWish> groupWishes,
    ILogger<CalendarService> logger) : ICalendarService
{
    public async Task<IApiResponse<IReadOnlyList<CalendarEventResponse>>> GetUpcomingAsync(
        Guid customerUserId, DateOnly from, DateOnly to, CancellationToken ct = default)
    {
        try
        {
            var events = new List<CalendarEventResponse>();

            var myWishes = await wishes.FindManyAsync(
                w => w.CustomerUserId == customerUserId && w.Status == WishStatus.Sealed, ct);
            foreach (var wish in myWishes)
            {
                var occurrence = NextOccurrence(wish.RecipientBirthday, from);
                if (occurrence is { } date && date <= to)
                {
                    events.Add(new CalendarEventResponse(
                        wish.Id,
                        CalendarEventKind.WishDelivery,
                        date,
                        $"Wish to {wish.RecipientName}",
                        $"Scheduled for delivery at {wish.DeliveryTime:HH:mm} ({wish.RecipientTimezone})."));
                }
            }

            var myPeople = await circlePeople.FindManyAsync(p => p.CustomerUserId == customerUserId, ct);
            foreach (var person in myPeople)
            {
                if (person.Birthday is not { } birthday) continue;

                var occurrence = NextOccurrence(birthday, from);
                if (occurrence is { } date && date <= to)
                {
                    events.Add(new CalendarEventResponse(
                        person.Id,
                        CalendarEventKind.Birthday,
                        date,
                        $"{person.Name}'s birthday",
                        person.RelationshipLabel));
                }
            }

            var myGroupWishes = await groupWishes.FindManyAsync(
                g => g.OrganizerCustomerUserId == customerUserId && g.Status == GroupWishStatus.Collecting, ct);
            foreach (var groupWish in myGroupWishes)
            {
                if (groupWish.CollectByDate is not { } collectBy) continue;
                if (collectBy >= from && collectBy <= to)
                {
                    events.Add(new CalendarEventResponse(
                        groupWish.Id,
                        CalendarEventKind.GroupWishDeadline,
                        collectBy,
                        $"Collect memories for {groupWish.Title}",
                        $"For {groupWish.RecipientName}."));
                }
            }

            IReadOnlyList<CalendarEventResponse> result = events.OrderBy(e => e.Date).ToList();
            return result.ToOkApiResponse("Calendar events retrieved successfully.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[GetUpcomingAsync] Failed to get calendar events for customer {CustomerUserId}", customerUserId);
            return ApiResponseFactory.InternalError<IReadOnlyList<CalendarEventResponse>>("Failed to retrieve calendar events.");
        }
    }

    /// <summary>The next calendar date on/after <paramref name="from"/> that matches the
    /// given month/day, rolling over to next year if this year's date has already passed.</summary>
    private static DateOnly? NextOccurrence(DateOnly monthDay, DateOnly from)
    {
        if (monthDay == default) return null;

        var candidate = new DateOnly(from.Year, monthDay.Month, monthDay.Day == 29 && !DateTime.IsLeapYear(from.Year) ? 28 : monthDay.Day);
        if (candidate < from) candidate = candidate.AddYears(1);
        return candidate;
    }
}
