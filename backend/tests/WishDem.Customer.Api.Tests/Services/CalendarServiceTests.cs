using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using WishDem.Common.Sdk.Enums;
using WishDem.Customer.Api.Models.Responses;
using WishDem.Customer.Api.Services;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;
using Xunit;

namespace WishDem.Customer.Api.Tests.Services;

public class CalendarServiceTests
{
    private readonly Mock<IRepository<Wish>> _wishes = new();
    private readonly Mock<IRepository<CirclePerson>> _circlePeople = new();
    private readonly Mock<IRepository<GroupWish>> _groupWishes = new();
    private readonly CalendarService _sut;

    public CalendarServiceTests()
    {
        _sut = new CalendarService(_wishes.Object, _circlePeople.Object, _groupWishes.Object, Mock.Of<ILogger<CalendarService>>());
    }

    [Fact]
    public async Task GetUpcomingAsync_IncludesSealedWishesAndBirthdaysAndDeadlines()
    {
        var customerUserId = Guid.NewGuid();
        var from = new DateOnly(2026, 1, 1);
        var to = from.AddDays(90);

        var wish = new Wish
        {
            CustomerUserId = customerUserId,
            RecipientName = "Kojo",
            RecipientRelationship = "Brother",
            RecipientTimezone = "Africa/Accra",
            RecipientOccasionDate = new DateOnly(2000, 2, 1),
            Status = WishStatus.Sealed,
        };
        var person = new CirclePerson
        {
            CustomerUserId = customerUserId,
            Name = "Ama",
            RelationshipLabel = "Sister",
            Birthday = new DateOnly(1998, 3, 1),
        };
        var groupWish = new GroupWish
        {
            OrganizerCustomerUserId = customerUserId,
            Title = "Surprise",
            RecipientName = "Yaw",
            CollectByDate = new DateOnly(2026, 2, 15),
            Status = GroupWishStatus.Collecting,
        };

        _wishes.Setup(r => r.FindManyAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Wish, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([wish]);
        _circlePeople.Setup(r => r.FindManyAsync(It.IsAny<System.Linq.Expressions.Expression<Func<CirclePerson, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([person]);
        _groupWishes.Setup(r => r.FindManyAsync(It.IsAny<System.Linq.Expressions.Expression<Func<GroupWish, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([groupWish]);

        var response = await _sut.GetUpcomingAsync(customerUserId, from, to);

        response.Code.Should().Be(200);
        response.Data.Should().HaveCount(3);
        response.Data!.Select(e => e.Kind).Should().Contain([
            CalendarEventKind.WishDelivery,
            CalendarEventKind.Birthday,
            CalendarEventKind.GroupWishDeadline,
        ]);
    }

    [Fact]
    public async Task GetUpcomingAsync_WhenRepositoryThrows_ReturnsInternalError()
    {
        _wishes.Setup(r => r.FindManyAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Wish, bool>>>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("db down"));

        var response = await _sut.GetUpcomingAsync(Guid.NewGuid(), DateOnly.FromDateTime(DateTime.UtcNow), DateOnly.FromDateTime(DateTime.UtcNow).AddDays(30));

        response.Code.Should().Be(500);
    }
}
