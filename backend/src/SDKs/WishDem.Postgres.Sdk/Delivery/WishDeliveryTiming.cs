using WishDem.Common.Sdk.Enums;
using WishDem.Postgres.Sdk.Entities;

namespace WishDem.Postgres.Sdk.Delivery;

/// <summary>Shared, timezone-aware "has this wish's delivery moment arrived?" logic —
/// used by both the Customer API's delivery worker (to decide what to actually send) and
/// the Admin API's delivery-health view (to report the same due/not-due bucket), so the
/// two never disagree with each other.
///
/// Birthday/Anniversary wishes recur every year, so "due" isn't "has the stored date
/// already passed" (true for almost every wish, almost always) — it's "has the FIRST
/// month+day+delivery-time occurrence on or after this wish was sealed arrived yet",
/// evaluated in the recipient's own timezone. Every other occasion type is a genuine
/// one-shot: the customer picked an actual future date, so we target that exact date —
/// no re-projecting it into next year if it's already passed.</summary>
public static class WishDeliveryTiming
{
    private static bool RecursAnnually(OccasionType occasion) =>
        occasion is OccasionType.Birthday or OccasionType.Anniversary;

    public static bool IsDue(Wish wish, DateTime utcNow) =>
        TargetOccurrenceUtc(wish) is { } occurrence && occurrence <= utcNow;

    /// <summary>The specific delivery instant (UTC) this wish is scheduled for. Returns
    /// null if RecipientOccasionDate was never set, or falls back to treating
    /// RecipientTimezone as UTC if it isn't a recognized IANA zone (rather than throwing
    /// and taking a whole delivery pass down with it).</summary>
    public static DateTime? TargetOccurrenceUtc(Wish wish)
    {
        if (wish.RecipientOccasionDate == default) return null;

        var timeZone = ResolveTimeZone(wish.RecipientTimezone);

        if (!RecursAnnually(wish.Occasion))
            return OccurrenceInYearUtc(wish, wish.RecipientOccasionDate.Year, timeZone);

        var anchorUtc = wish.SealedAtUtc ?? wish.CreatedAtUtc;
        var localAnchor = TimeZoneInfo.ConvertTimeFromUtc(anchorUtc, timeZone);

        var candidateUtc = OccurrenceInYearUtc(wish, localAnchor.Year, timeZone);
        if (candidateUtc < anchorUtc) candidateUtc = OccurrenceInYearUtc(wish, localAnchor.Year + 1, timeZone);
        return candidateUtc;
    }

    private static DateTime OccurrenceInYearUtc(Wish wish, int year, TimeZoneInfo timeZone)
    {
        var day = wish.RecipientOccasionDate.Day == 29 && !DateTime.IsLeapYear(year)
            ? 28
            : wish.RecipientOccasionDate.Day;
        var candidateLocal = new DateTime(
            year, wish.RecipientOccasionDate.Month, day,
            wish.DeliveryTime.Hour, wish.DeliveryTime.Minute, wish.DeliveryTime.Second,
            DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(candidateLocal, timeZone);
    }

    private static TimeZoneInfo ResolveTimeZone(string? ianaId)
    {
        if (string.IsNullOrWhiteSpace(ianaId)) return TimeZoneInfo.Utc;
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(ianaId);
        }
        catch (Exception e) when (e is TimeZoneNotFoundException or InvalidTimeZoneException)
        {
            return TimeZoneInfo.Utc;
        }
    }
}
