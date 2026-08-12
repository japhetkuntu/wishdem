using WishDem.Common.Sdk.Enums;
using WishDem.Postgres.Sdk.Entities;

namespace WishDem.Postgres.Sdk.Delivery;

/// <summary>Shared "has this wish's delivery moment arrived?" logic — used by both the
/// Customer API's delivery worker (to decide what to actually send) and the Admin API's
/// delivery-health view (to report the same due/not-due bucket), so the two never disagree
/// with each other.
///
/// Birthday/Anniversary wishes recur every year, so "due" isn't "has the stored date
/// already passed" (true for almost every wish, almost always) — it's "has the FIRST
/// month+day+delivery-time occurrence on or after this wish was sealed arrived yet". Every
/// other occasion type is a genuine one-shot: the customer picked an actual future date, so
/// we target that exact date — no re-projecting it into next year if it's already passed.
///
/// All timing is evaluated in Ghana time (Africa/Accra), not a per-wish stored timezone.
/// WishDem is a Ghana-based product; trying to honor an arbitrary IANA zone captured from
/// the sender's own browser was producing wrong "is this due yet" results whenever that
/// captured value didn't match the recipient's actual location. One fixed zone for
/// everyone is simpler and, for this product's current scope, more correct.</summary>
public static class WishDeliveryTiming
{
    /// <summary>Attempt count at which the delivery worker slows from fast exponential
    /// backoff to a once-a-day retry — shared with the Customer API so its "delivery
    /// struggling" flag (surfaced to the sender and to Admin) lines up with the same
    /// threshold the worker itself uses, instead of the two silently drifting apart.</summary>
    public const int StruggledDeliveryAttempts = 8;

    private static readonly TimeZoneInfo GhanaTimeZone = ResolveGhanaTimeZone();

    private static bool RecursAnnually(OccasionType occasion) =>
        occasion is OccasionType.Birthday or OccasionType.Anniversary;

    public static bool IsDue(Wish wish, DateTime utcNow) =>
        TargetOccurrenceUtc(wish) is { } occurrence && occurrence <= utcNow;

    /// <summary>The specific delivery instant (UTC) this wish is scheduled for. Returns
    /// null if RecipientOccasionDate was never set.</summary>
    public static DateTime? TargetOccurrenceUtc(Wish wish)
    {
        if (wish.RecipientOccasionDate == default) return null;

        if (!RecursAnnually(wish.Occasion))
            return OccurrenceInYearUtc(wish, wish.RecipientOccasionDate.Year);

        return NextOccurrenceOnOrAfter(wish, wish.SealedAtUtc ?? wish.CreatedAtUtc);
    }

    /// <summary>For a recurring (Birthday/Anniversary) wish that has already been delivered
    /// once, this is the next annual occurrence on or after the given reference instant —
    /// used to schedule a reminder for the sender to write a NEW wish for that occurrence,
    /// not to redeliver the one that already went out. Returns null for one-time occasions,
    /// where there is no "next" occurrence to remind anyone about.</summary>
    public static DateTime? NextRecurringOccurrenceUtc(Wish wish, DateTime referenceUtc)
    {
        if (!RecursAnnually(wish.Occasion) || wish.RecipientOccasionDate == default) return null;
        return NextOccurrenceOnOrAfter(wish, referenceUtc);
    }

    private static DateTime NextOccurrenceOnOrAfter(Wish wish, DateTime referenceUtc)
    {
        var localRef = TimeZoneInfo.ConvertTimeFromUtc(referenceUtc, GhanaTimeZone);
        var candidateUtc = OccurrenceInYearUtc(wish, localRef.Year);
        if (candidateUtc < referenceUtc) candidateUtc = OccurrenceInYearUtc(wish, localRef.Year + 1);
        return candidateUtc;
    }

    private static DateTime OccurrenceInYearUtc(Wish wish, int year)
    {
        var day = wish.RecipientOccasionDate.Day == 29 && !DateTime.IsLeapYear(year)
            ? 28
            : wish.RecipientOccasionDate.Day;
        var candidateLocal = new DateTime(
            year, wish.RecipientOccasionDate.Month, day,
            wish.DeliveryTime.Hour, wish.DeliveryTime.Minute, wish.DeliveryTime.Second,
            DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(candidateLocal, GhanaTimeZone);
    }

    private static TimeZoneInfo ResolveGhanaTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("Africa/Accra");
        }
        catch (Exception e) when (e is TimeZoneNotFoundException or InvalidTimeZoneException)
        {
            // Accra has no DST and sits at UTC+0 year-round, so UTC is an exact
            // equivalent — not just a rough fallback — if the OS is missing tzdata.
            return TimeZoneInfo.Utc;
        }
    }
}
