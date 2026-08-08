using System.Linq.Expressions;
using Akka.Actor;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using WishDem.Actors.Sdk.Abstractions;
using WishDem.Actors.Sdk.Messages;
using WishDem.Common.Sdk.Enums;
using WishDem.Customer.Api.Services;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;
using Xunit;

namespace WishDem.Customer.Api.Tests.Services;

public class WishDeliveryDispatchServiceTests
{
    private readonly Mock<IRepository<Wish>> _wishes = new();
    private readonly Mock<IActorRef> _deliveryDispatcher = new();
    private readonly Mock<IActorGateway> _actors = new();
    private readonly WishDeliveryDispatchService _sut;

    public WishDeliveryDispatchServiceTests()
    {
        _actors.Setup(a => a.DeliveryDispatcher).Returns(_deliveryDispatcher.Object);
        _sut = new WishDeliveryDispatchService(_wishes.Object, _actors.Object, Mock.Of<ILogger<WishDeliveryDispatchService>>());
    }

    private static readonly DateTime SealedLongAgo = new(2020, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private static Wish NewDueSealedWish() => new()
    {
        FromName = "Ama",
        RecipientName = "Kojo",
        RecipientRelationship = "Brother",
        RecipientTimezone = "Africa/Accra",
        RecipientBirthday = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)),
        DeliveryTime = new TimeOnly(0, 0),
        Channel = DeliveryChannel.Link,
        Status = WishStatus.Sealed,
        SealedAtUtc = SealedLongAgo,
    };

    private void SetupCandidates(params Wish[] wishesToReturn) =>
        _wishes.Setup(r => r.FindManyAsync(It.IsAny<Expression<Func<Wish, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(wishesToReturn);

    [Fact]
    public async Task DispatchDueWishesAsync_ForEachDueWish_TellsDeliveryDispatcher()
    {
        var wish = NewDueSealedWish();
        SetupCandidates(wish);

        var count = await _sut.DispatchDueWishesAsync();

        count.Should().Be(1);
        _deliveryDispatcher.Verify(
            d => d.Tell(It.Is<DeliverWish>(m => m.WishId == wish.Id), It.IsAny<IActorRef>()),
            Times.Once);
    }

    [Fact]
    public async Task DispatchDueWishesAsync_TellsOncePerDueWish_WithoutWaitingForDelivery()
    {
        var first = NewDueSealedWish();
        var second = NewDueSealedWish();
        SetupCandidates(first, second);

        var count = await _sut.DispatchDueWishesAsync();

        // Dispatch only ever hands wishes off — it never awaits delivery itself, which is
        // what lets the actor pool process many wishes concurrently instead of one at a time.
        count.Should().Be(2);
        _deliveryDispatcher.Verify(d => d.Tell(It.IsAny<DeliverWish>(), It.IsAny<IActorRef>()), Times.Exactly(2));
        _wishes.Verify(r => r.UpdateAsync(It.IsAny<Wish>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task DispatchDueWishesAsync_WhenNoWishesAreDue_ReturnsZeroAndTellsNothing()
    {
        SetupCandidates();

        var count = await _sut.DispatchDueWishesAsync();

        count.Should().Be(0);
        _deliveryDispatcher.Verify(d => d.Tell(It.IsAny<object>(), It.IsAny<IActorRef>()), Times.Never);
    }

    [Fact]
    public async Task DispatchDueWishesAsync_ExcludesWishesNotYetDue()
    {
        var notYetDue = new Wish
        {
            FromName = "Ama",
            RecipientName = "Kojo",
            RecipientRelationship = "Brother",
            RecipientTimezone = "Africa/Accra",
            RecipientBirthday = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
            DeliveryTime = new TimeOnly(0, 0),
            Channel = DeliveryChannel.Link,
            Status = WishStatus.Sealed,
            SealedAtUtc = DateTime.UtcNow,
        };
        SetupCandidates(notYetDue);

        var count = await _sut.DispatchDueWishesAsync();

        count.Should().Be(0);
        _deliveryDispatcher.Verify(d => d.Tell(It.IsAny<object>(), It.IsAny<IActorRef>()), Times.Never);
    }
}
