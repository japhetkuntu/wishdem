using System.Linq.Expressions;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using WishDem.Admin.Api.Services;
using WishDem.Common.Sdk.Enums;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;
using Xunit;

namespace WishDem.Admin.Api.Tests.Services;

public class DeliveryHealthServiceTests
{
    private readonly Mock<IRepository<Wish>> _wishes = new();
    private readonly DeliveryHealthService _sut;

    public DeliveryHealthServiceTests()
    {
        _sut = new DeliveryHealthService(_wishes.Object, Mock.Of<ILogger<DeliveryHealthService>>());
    }

    private static Wish NewWish(WishStatus status) => new()
    {
        RecipientName = "Kojo",
        RecipientRelationship = "Brother",
        RecipientTimezone = "Africa/Accra",
        Status = status,
    };

    [Fact]
    public async Task GetHealthAsync_BucketsDraftDeliveredAndOpenedFromQueryable()
    {
        var draft = NewWish(WishStatus.Draft);
        var delivered = NewWish(WishStatus.Delivered);
        delivered.DeliveredAtUtc = DateTime.UtcNow.AddDays(-1);
        var opened = NewWish(WishStatus.Opened);
        opened.OpenedAtUtc = DateTime.UtcNow.AddHours(-1);

        _wishes.Setup(r => r.GetQueryable()).Returns(new[] { draft, delivered, opened }.AsQueryable());
        _wishes.Setup(r => r.FindManyAsync(It.IsAny<Expression<Func<Wish, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        var response = await _sut.GetHealthAsync();

        response.Code.Should().Be(200);
        response.Data!.Draft.Should().Be(1);
        response.Data.Delivered.Should().Be(1);
        response.Data.Opened.Should().Be(1);
        response.Data.Due.Should().Be(0);
    }

    [Fact]
    public async Task GetHealthAsync_CountsSealedWishesPastDeliveryTimeAsDue()
    {
        var pastBirthday = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1));
        var sealedDue = NewWish(WishStatus.Sealed);
        sealedDue.RecipientOccasionDate = pastBirthday;
        sealedDue.DeliveryTime = new TimeOnly(0, 0);
        // Sealed well before the birthday, so the target occurrence is this year's — and
        // "yesterday" is already behind it.
        sealedDue.SealedAtUtc = DateTime.UtcNow.AddMonths(-6);

        _wishes.Setup(r => r.GetQueryable()).Returns(Array.Empty<Wish>().AsQueryable());
        _wishes.Setup(r => r.FindManyAsync(It.IsAny<Expression<Func<Wish, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([sealedDue]);

        var response = await _sut.GetHealthAsync();

        response.Code.Should().Be(200);
        response.Data!.Due.Should().Be(1);
    }

    [Fact]
    public async Task GetHealthAsync_WhenRepositoryThrows_ReturnsInternalError()
    {
        _wishes.Setup(r => r.GetQueryable()).Throws(new InvalidOperationException("db down"));

        var response = await _sut.GetHealthAsync();

        response.Code.Should().Be(500);
    }
}
