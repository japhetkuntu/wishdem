using System.Linq.Expressions;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using WishDem.Actors.Sdk.Configuration;
using WishDem.Common.Sdk.Enums;
using WishDem.Customer.Api.Services;
using WishDem.Messaging.Sdk.Abstractions;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;
using Xunit;

namespace WishDem.Customer.Api.Tests.Services;

public class RecurringWishReminderServiceTests
{
    private readonly Mock<IRepository<Wish>> _wishes = new();
    private readonly Mock<IRepository<CustomerUser>> _customerUsers = new();
    private readonly Mock<IEmailSender> _emailSender = new();
    private readonly RecurringWishReminderService _sut;

    public RecurringWishReminderServiceTests()
    {
        _sut = new RecurringWishReminderService(
            _wishes.Object, _customerUsers.Object, _emailSender.Object,
            Options.Create(new DeliverySettings { FrontendBaseUrl = "http://localhost:5173" }),
            Mock.Of<ILogger<RecurringWishReminderService>>());
    }

    // Month/day computed relative to "today" (like WishDeliveryDispatchServiceTests does)
    // so the test doesn't go stale — the reminder window is measured off the real clock.
    private static Wish NewDeliveredRecurringWish(int daysUntilNextOccurrence, OccasionType occasion = OccasionType.Birthday)
    {
        var nextOccurrence = DateTime.UtcNow.AddDays(daysUntilNextOccurrence);
        return new Wish
        {
            CustomerUserId = Guid.NewGuid(),
            FromName = "Ama",
            RecipientName = "Kojo",
            RecipientRelationship = "Brother",
            RecipientTimezone = "Africa/Accra",
            Occasion = occasion,
            // Year is irrelevant to NextRecurringOccurrenceUtc (only month/day matter) — a
            // birth year decades back is what a real wish would store.
            RecipientOccasionDate = new DateOnly(1995, nextOccurrence.Month, nextOccurrence.Day),
            DeliveryTime = new TimeOnly(nextOccurrence.Hour, nextOccurrence.Minute),
            Channel = DeliveryChannel.Link,
            Status = WishStatus.Delivered,
            SealedAtUtc = DateTime.UtcNow.AddYears(-1),
            DeliveredAtUtc = DateTime.UtcNow.AddYears(-1),
        };
    }

    private void SetupCandidates(params Wish[] wishesToReturn) =>
        _wishes.Setup(r => r.FindManyAsync(It.IsAny<Expression<Func<Wish, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(wishesToReturn);

    [Fact]
    public async Task SendDueRemindersAsync_WhenNextOccurrenceIsSoon_EmailsSenderAndRecordsTimestamp()
    {
        var wish = NewDeliveredRecurringWish(daysUntilNextOccurrence: 3);
        SetupCandidates(wish);
        _customerUsers.Setup(r => r.GetByIdAsync(wish.CustomerUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CustomerUser { Id = wish.CustomerUserId, Email = "ama@example.com", Name = "Ama" });
        _wishes.Setup(r => r.UpdateAsync(It.IsAny<Wish>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var sent = await _sut.SendDueRemindersAsync();

        sent.Should().Be(1);
        _emailSender.Verify(
            e => e.SendAsync("ama@example.com", It.Is<string>(s => s.Contains("Kojo")), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()),
            Times.Once);
        // Never resends the wish itself — only a fresh-write nudge — so nothing about the
        // original delivery bookkeeping should move.
        wish.DeliveredAtUtc.Should().NotBeNull();
        wish.LastRecurringReminderAtUtc.Should().NotBeNull();
    }

    [Fact]
    public async Task SendDueRemindersAsync_WhenNextOccurrenceIsFarAway_DoesNotSend()
    {
        var wish = NewDeliveredRecurringWish(daysUntilNextOccurrence: 60);
        SetupCandidates(wish);

        var sent = await _sut.SendDueRemindersAsync();

        sent.Should().Be(0);
        _emailSender.Verify(e => e.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task SendDueRemindersAsync_WhenAlreadyRemindedThisCycle_DoesNotSendAgain()
    {
        var wish = NewDeliveredRecurringWish(daysUntilNextOccurrence: 3);
        wish.LastRecurringReminderAtUtc = DateTime.UtcNow.AddDays(-2);
        SetupCandidates(wish);

        var sent = await _sut.SendDueRemindersAsync();

        sent.Should().Be(0);
        _emailSender.Verify(e => e.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task SendDueRemindersAsync_WhenLastReminderWasForAPreviousCycle_SendsAgain()
    {
        var wish = NewDeliveredRecurringWish(daysUntilNextOccurrence: 3);
        wish.LastRecurringReminderAtUtc = DateTime.UtcNow.AddDays(-300); // last year's reminder
        SetupCandidates(wish);
        _customerUsers.Setup(r => r.GetByIdAsync(wish.CustomerUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CustomerUser { Id = wish.CustomerUserId, Email = "ama@example.com", Name = "Ama" });
        _wishes.Setup(r => r.UpdateAsync(It.IsAny<Wish>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var sent = await _sut.SendDueRemindersAsync();

        sent.Should().Be(1);
    }

    [Fact]
    public async Task SendDueRemindersAsync_ForOneTimeOccasion_NeverSends()
    {
        var wish = NewDeliveredRecurringWish(daysUntilNextOccurrence: 3, occasion: OccasionType.Congratulations);
        SetupCandidates(wish);

        var sent = await _sut.SendDueRemindersAsync();

        sent.Should().Be(0);
    }
}
