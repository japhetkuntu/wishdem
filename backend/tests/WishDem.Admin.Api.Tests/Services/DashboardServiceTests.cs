using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using WishDem.Admin.Api.Services;
using WishDem.Common.Sdk.Enums;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;
using Xunit;

namespace WishDem.Admin.Api.Tests.Services;

public class DashboardServiceTests
{
    private readonly Mock<IRepository<Wish>> _wishes = new();
    private readonly Mock<IRepository<Payment>> _payments = new();
    private readonly Mock<IRepository<ModerationCase>> _moderationCases = new();
    private readonly Mock<IRepository<CustomerUser>> _customerUsers = new();
    private readonly DashboardService _sut;

    public DashboardServiceTests()
    {
        _sut = new DashboardService(_wishes.Object, _payments.Object, _moderationCases.Object, _customerUsers.Object, Mock.Of<ILogger<DashboardService>>());
    }

    private static Wish NewWish(WishStatus status = WishStatus.Draft) => new()
    {
        RecipientName = "Kojo",
        RecipientRelationship = "Brother",
        RecipientTimezone = "Africa/Accra",
        Status = status,
    };

    [Fact]
    public async Task GetOverviewAsync_AggregatesCountsAndRevenue()
    {
        var today = DateTime.UtcNow;
        var sealedToday = NewWish(WishStatus.Sealed);
        sealedToday.SealedAtUtc = today;
        var openedToday = NewWish(WishStatus.Opened);
        openedToday.OpenedAtUtc = today;
        var draft = NewWish();

        _wishes.Setup(r => r.GetQueryable()).Returns(new[] { sealedToday, openedToday, draft }.AsQueryable());
        _moderationCases.Setup(r => r.GetQueryable()).Returns(new[]
        {
            new ModerationCase { WishId = Guid.NewGuid(), Title = "Case 1", Status = ModerationStatus.UnderReview },
            new ModerationCase { WishId = Guid.NewGuid(), Title = "Case 2", Status = ModerationStatus.Resolved },
        }.AsQueryable());

        var succeeded = new Payment { WishId = Guid.NewGuid(), PhoneNumber = "0244000000", Provider = PaymentProvider.Mtn, Amount = 10m, Status = PaymentStatus.Succeeded };
        var reversed = new Payment { WishId = Guid.NewGuid(), PhoneNumber = "0244000001", Provider = PaymentProvider.Mtn, Amount = 5m, Status = PaymentStatus.Reversed, RefundAmount = 2m };
        _payments.Setup(r => r.GetQueryable()).Returns(new[] { succeeded, reversed }.AsQueryable());

        _customerUsers.Setup(r => r.GetQueryable()).Returns(new[]
        {
            new CustomerUser { Email = "a@wishdem.com", Name = "A" },
            new CustomerUser { Email = "b@wishdem.com", Name = "B" },
        }.AsQueryable());

        var response = await _sut.GetOverviewAsync();

        response.Code.Should().Be(200);
        response.Data!.TotalWishes.Should().Be(3);
        response.Data.SealedTodayCount.Should().Be(1);
        response.Data.OpenedTodayCount.Should().Be(1);
        response.Data.OpenModerationCasesCount.Should().Be(1);
        // The Reversed payment's Status already moved off Succeeded, so its Amount is
        // excluded from the sum — RefundAmount isn't subtracted again on top of that.
        response.Data.TotalRevenue.Should().Be(10m);
        response.Data.TotalCustomers.Should().Be(2);
    }

    [Fact]
    public async Task GetOverviewAsync_WhenOnlyPaymentIsRefunded_RevenueIsZeroNotNegative()
    {
        _wishes.Setup(r => r.GetQueryable()).Returns(Array.Empty<Wish>().AsQueryable());
        _moderationCases.Setup(r => r.GetQueryable()).Returns(Array.Empty<ModerationCase>().AsQueryable());
        _customerUsers.Setup(r => r.GetQueryable()).Returns(Array.Empty<CustomerUser>().AsQueryable());

        var reversed = new Payment { WishId = Guid.NewGuid(), PhoneNumber = "0244000000", Provider = PaymentProvider.Mtn, Amount = 1.49m, Status = PaymentStatus.Reversed, RefundAmount = 1.49m };
        _payments.Setup(r => r.GetQueryable()).Returns(new[] { reversed }.AsQueryable());

        var response = await _sut.GetOverviewAsync();

        response.Data!.TotalRevenue.Should().Be(0m);
    }

    [Fact]
    public async Task GetOverviewAsync_WhenRepositoryThrows_ReturnsInternalError()
    {
        _wishes.Setup(r => r.GetQueryable()).Throws(new InvalidOperationException("db down"));

        var response = await _sut.GetOverviewAsync();

        response.Code.Should().Be(500);
    }
}
