using FluentAssertions;
using WishDem.Postgres.Sdk.Delivery;
using WishDem.Postgres.Sdk.Entities;
using Xunit;

namespace WishDem.Postgres.Sdk.Tests.Delivery;

public class WishDeliveryTimingTests
{
    private static Wish NewWish(DateOnly birthday, TimeOnly deliveryTime, string timezone, DateTime sealedAtUtc) => new()
    {
        RecipientName = "Kojo",
        RecipientRelationship = "Brother",
        RecipientTimezone = timezone,
        RecipientBirthday = birthday,
        DeliveryTime = deliveryTime,
        SealedAtUtc = sealedAtUtc,
    };

    private static readonly DateTime SealedInJanuary2026 = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void IsDue_WhenBirthdayNotSet_ReturnsFalse()
    {
        var wish = NewWish(default, new TimeOnly(9, 0), "Africa/Accra", SealedInJanuary2026);

        WishDeliveryTiming.IsDue(wish, DateTime.UtcNow).Should().BeFalse();
    }

    [Fact]
    public void IsDue_WhenTargetOccurrenceAlreadyPassed_ReturnsTrue()
    {
        // Africa/Accra is UTC+0, so local and UTC clocks match exactly here. Sealed in
        // January 2026, so the target is 2026-08-10 09:00 — and "now" is after that.
        var wish = NewWish(new DateOnly(1995, 8, 10), new TimeOnly(9, 0), "Africa/Accra", SealedInJanuary2026);
        var utcNow = new DateTime(2026, 8, 10, 12, 0, 0, DateTimeKind.Utc);

        WishDeliveryTiming.IsDue(wish, utcNow).Should().BeTrue();
    }

    [Fact]
    public void IsDue_WhenTargetOccurrenceStillAhead_ReturnsFalse()
    {
        var wish = NewWish(new DateOnly(1995, 8, 10), new TimeOnly(9, 0), "Africa/Accra", SealedInJanuary2026);
        var utcNow = new DateTime(2026, 8, 10, 6, 0, 0, DateTimeKind.Utc); // still before 09:00

        WishDeliveryTiming.IsDue(wish, utcNow).Should().BeFalse();
    }

    [Fact]
    public void IsDue_WhenLocalOccurrenceLaterTodayInAheadTimezone_ReturnsFalse()
    {
        // Asia/Tokyo is UTC+9. At 2026-08-09 20:00 UTC it's 2026-08-10 05:00 in Tokyo —
        // the 09:00 local delivery moment hasn't arrived yet.
        var wish = NewWish(new DateOnly(1995, 8, 10), new TimeOnly(9, 0), "Asia/Tokyo", SealedInJanuary2026);
        var utcNow = new DateTime(2026, 8, 9, 20, 0, 0, DateTimeKind.Utc);

        WishDeliveryTiming.IsDue(wish, utcNow).Should().BeFalse();
    }

    [Fact]
    public void IsDue_WhenLocalOccurrenceInAheadTimezoneHasPassed_ReturnsTrue()
    {
        var wish = NewWish(new DateOnly(1995, 8, 10), new TimeOnly(9, 0), "Asia/Tokyo", SealedInJanuary2026);
        var utcNow = new DateTime(2026, 8, 10, 1, 0, 0, DateTimeKind.Utc); // 2026-08-10 10:00 Tokyo

        WishDeliveryTiming.IsDue(wish, utcNow).Should().BeTrue();
    }

    [Fact]
    public void IsDue_WhenSealedAfterThisYearsBirthday_TargetsNextYear()
    {
        // Sealed in September (after the Aug 10 birthday already passed for the year), so
        // the target should roll forward to next year's Aug 10 — not "due" even a year later
        // minus a day.
        var sealedInSeptember = new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc);
        var wish = NewWish(new DateOnly(1995, 8, 10), new TimeOnly(9, 0), "Africa/Accra", sealedInSeptember);

        WishDeliveryTiming.IsDue(wish, new DateTime(2027, 8, 9, 0, 0, 0, DateTimeKind.Utc)).Should().BeFalse();
        WishDeliveryTiming.IsDue(wish, new DateTime(2027, 8, 10, 10, 0, 0, DateTimeKind.Utc)).Should().BeTrue();
    }

    [Fact]
    public void MostRecentOccurrenceUtc_WhenTimezoneIsUnrecognized_FallsBackToUtcRatherThanThrowing()
    {
        var wish = NewWish(new DateOnly(1995, 8, 10), new TimeOnly(9, 0), "Not/A/RealZone", SealedInJanuary2026);

        var act = () => WishDeliveryTiming.TargetOccurrenceUtc(wish);

        act.Should().NotThrow();
    }

    [Fact]
    public void TargetOccurrenceUtc_HandlesFeb29OnNonLeapYearsByUsingFeb28()
    {
        var sealedInJanuary = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc); // 2026 isn't a leap year
        var wish = NewWish(new DateOnly(1996, 2, 29), new TimeOnly(9, 0), "Africa/Accra", sealedInJanuary);

        var occurrence = WishDeliveryTiming.TargetOccurrenceUtc(wish);

        occurrence!.Value.Month.Should().Be(2);
        occurrence.Value.Day.Should().Be(28);
    }
}
