using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using WishDem.Actors.Sdk.Configuration;
using WishDem.Actors.Sdk.Delivery;
using WishDem.Common.Sdk.Enums;
using WishDem.Messaging.Sdk;
using WishDem.Messaging.Sdk.Abstractions;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Actors.Sdk.Tests.Delivery;

public class WishDeliveryProcessorTests
{
    private readonly Mock<IRepository<Wish>> _wishes = new();
    private readonly Mock<IRepository<CustomerUser>> _customerUsers = new();
    private readonly Mock<ISmsSender> _smsSender = new();
    private readonly Mock<IEmailSender> _emailSender = new();
    private readonly WishDeliveryProcessor _sut;

    public WishDeliveryProcessorTests()
    {
        var settings = Options.Create(new DeliverySettings { FrontendBaseUrl = "http://localhost:5173" });
        _sut = new WishDeliveryProcessor(
            _wishes.Object, _customerUsers.Object, _smsSender.Object, _emailSender.Object,
            settings, Mock.Of<ILogger<WishDeliveryProcessor>>());
    }

    private static readonly DateTime SealedLongAgo = new(2020, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private static Wish NewDueSealedWish(DeliveryChannel channel, string? phoneNumber = null) => new()
    {
        FromName = "Ama",
        RecipientName = "Kojo",
        RecipientRelationship = "Brother",
        RecipientTimezone = "Africa/Accra",
        RecipientOccasionDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)),
        DeliveryTime = new TimeOnly(0, 0),
        RecipientPhoneNumber = phoneNumber,
        Channel = channel,
        Status = WishStatus.Sealed,
        SealedAtUtc = SealedLongAgo,
    };

    private void SetupWish(Wish wish) =>
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);

    [Fact]
    public async Task DeliverAsync_ForSmsChannelWithPhone_SendsSmsAndMarksDelivered()
    {
        var wish = NewDueSealedWish(DeliveryChannel.Sms, "0244123456");
        SetupWish(wish);
        _wishes.Setup(r => r.UpdateAsync(wish, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var delivered = await _sut.DeliverAsync(wish.Id);

        delivered.Should().BeTrue();
        wish.DeliveredAtUtc.Should().NotBeNull();
        // Frontend's "is this due yet" check is `status !== "sealed"` — Status must
        // actually move off Sealed on a successful send, or the recipient's seal button
        // never appears even though the message went out.
        wish.Status.Should().Be(WishStatus.Delivered);
        _smsSender.Verify(s => s.SendAsync("0244123456", It.Is<string>(m => m.Contains("Kojo") && m.Contains("/w/" + wish.Id)), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeliverAsync_ForWhatsAppChannelWithPhone_SendsViaSmsAsFallback()
    {
        // No WhatsApp provider is wired up — WhatsApp-channel wishes fall back to SMS,
        // deliberately, not silently dropped.
        var wish = NewDueSealedWish(DeliveryChannel.WhatsApp, "0244123456");
        SetupWish(wish);
        _wishes.Setup(r => r.UpdateAsync(wish, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var delivered = await _sut.DeliverAsync(wish.Id);

        delivered.Should().BeTrue();
        _smsSender.Verify(s => s.SendAsync("0244123456", It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeliverAsync_ForLinkChannel_MarksDeliveredWithoutSendingAnything()
    {
        var wish = NewDueSealedWish(DeliveryChannel.Link);
        SetupWish(wish);
        _wishes.Setup(r => r.UpdateAsync(wish, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var delivered = await _sut.DeliverAsync(wish.Id);

        delivered.Should().BeTrue();
        wish.DeliveredAtUtc.Should().NotBeNull();
        wish.Status.Should().Be(WishStatus.Delivered);
        _smsSender.Verify(s => s.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeliverAsync_ForSmsChannelWithoutPhoneNumber_SkipsAndLeavesUndeliveredButRecordsAttempt()
    {
        var wish = NewDueSealedWish(DeliveryChannel.Sms, phoneNumber: null);
        SetupWish(wish);
        _wishes.Setup(r => r.UpdateAsync(wish, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var delivered = await _sut.DeliverAsync(wish.Id);

        delivered.Should().BeFalse();
        wish.DeliveredAtUtc.Should().BeNull();
        wish.DeliveryAttemptCount.Should().Be(1);
        wish.NextDeliveryAttemptAtUtc.Should().NotBeNull();
        _wishes.Verify(r => r.UpdateAsync(wish, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeliverAsync_WhenSmsSendThrowsMessagingException_LeavesWishUndeliveredAndSchedulesBackoff()
    {
        var wish = NewDueSealedWish(DeliveryChannel.Sms, "0244000000");
        SetupWish(wish);
        _wishes.Setup(r => r.UpdateAsync(wish, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _smsSender.Setup(s => s.SendAsync("0244000000", It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new MessagingException("Insufficient balance"));

        var delivered = await _sut.DeliverAsync(wish.Id);

        delivered.Should().BeFalse();
        wish.DeliveredAtUtc.Should().BeNull();
        wish.DeliveryAttemptCount.Should().Be(1);
        wish.NextDeliveryAttemptAtUtc.Should().NotBeNull();
        _wishes.Verify(r => r.UpdateAsync(wish, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeliverAsync_AfterMaxAttempts_SlowsToDailyRetryInsteadOfGivingUp()
    {
        var wish = NewDueSealedWish(DeliveryChannel.Sms, phoneNumber: null);
        wish.DeliveryAttemptCount = 7; // one below the cap
        SetupWish(wish);
        _wishes.Setup(r => r.UpdateAsync(wish, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var delivered = await _sut.DeliverAsync(wish.Id);

        delivered.Should().BeFalse();
        wish.DeliveryAttemptCount.Should().Be(8);
        // Still automatically retried later — not DateTime.MaxValue (which would mean
        // "never again, needs a human to click retry").
        wish.NextDeliveryAttemptAtUtc.Should().BeCloseTo(DateTime.UtcNow.AddHours(24), TimeSpan.FromMinutes(1));
    }

    [Fact]
    public async Task DeliverAsync_WellPastMaxAttempts_KeepsRetryingWithoutRenotifying()
    {
        var customerUserId = Guid.NewGuid();
        var wish = NewDueSealedWish(DeliveryChannel.Sms, phoneNumber: null);
        wish.CustomerUserId = customerUserId;
        wish.DeliveryAttemptCount = 20; // long past the cap — should still be retried, not abandoned
        SetupWish(wish);
        _wishes.Setup(r => r.UpdateAsync(wish, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var delivered = await _sut.DeliverAsync(wish.Id);

        delivered.Should().BeFalse();
        wish.DeliveryAttemptCount.Should().Be(21);
        wish.NextDeliveryAttemptAtUtc.Should().BeCloseTo(DateTime.UtcNow.AddHours(24), TimeSpan.FromMinutes(1));
        _emailSender.Verify(e => e.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DeliverAsync_AfterMaxAttempts_NotifiesSenderByEmail()
    {
        var customerUserId = Guid.NewGuid();
        var wish = NewDueSealedWish(DeliveryChannel.Sms, phoneNumber: null);
        wish.CustomerUserId = customerUserId;
        wish.DeliveryAttemptCount = 7;
        SetupWish(wish);
        _wishes.Setup(r => r.UpdateAsync(wish, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _customerUsers.Setup(r => r.GetByIdAsync(customerUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CustomerUser { Id = customerUserId, Email = "sender@example.com", Name = "Ama" });

        await _sut.DeliverAsync(wish.Id);

        _emailSender.Verify(e => e.SendAsync("sender@example.com", It.Is<string>(s => s.Contains("Kojo")), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeliverAsync_WhenWishNoLongerExists_ReturnsTrueWithoutThrowing()
    {
        _wishes.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((Wish?)null);

        var delivered = await _sut.DeliverAsync(Guid.NewGuid());

        delivered.Should().BeTrue();
    }

    [Fact]
    public async Task DeliverAsync_WhenAlreadyDelivered_ReturnsTrueWithoutResendingOrUpdating()
    {
        var wish = NewDueSealedWish(DeliveryChannel.Sms, "0244123456");
        wish.DeliveredAtUtc = DateTime.UtcNow.AddMinutes(-5);
        SetupWish(wish);

        var delivered = await _sut.DeliverAsync(wish.Id);

        delivered.Should().BeTrue();
        _smsSender.Verify(s => s.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        _wishes.Verify(r => r.UpdateAsync(It.IsAny<Wish>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
