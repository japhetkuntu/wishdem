using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using WishDem.Common.Sdk.Enums;
using WishDem.Customer.Api.Services;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;
using Xunit;

namespace WishDem.Customer.Api.Tests.Services;

public class BirthdayBloomServiceTests
{
    private readonly Mock<IRepository<GroupWish>> _groupWishes = new();
    private readonly Mock<IRepository<GroupWishMemory>> _memories = new();
    private readonly Mock<IRepository<GroupWishInvitation>> _invitations = new();
    private readonly Mock<IRepository<CustomerUser>> _customerUsers = new();
    private readonly BirthdayBloomService _sut;

    public BirthdayBloomServiceTests()
    {
        _sut = new BirthdayBloomService(_groupWishes.Object, _memories.Object, _invitations.Object, _customerUsers.Object, Mock.Of<ILogger<BirthdayBloomService>>());

        _invitations.Setup(r => r.FindManyAsync(It.IsAny<System.Linq.Expressions.Expression<Func<GroupWishInvitation, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        _memories.Setup(r => r.FindManyAsync(It.IsAny<System.Linq.Expressions.Expression<Func<GroupWishMemory, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
    }

    [Fact]
    public async Task GetAsync_WhenSealed_ReturnsOk()
    {
        var groupWish = new GroupWish { Title = "T", RecipientName = "R", Status = GroupWishStatus.Sealed, OrganizerCustomerUserId = Guid.NewGuid() };
        _groupWishes.Setup(r => r.GetByIdAsync(groupWish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(groupWish);
        _customerUsers.Setup(r => r.GetByIdAsync(groupWish.OrganizerCustomerUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CustomerUser { Email = "a@b.com", Name = "Organizer" });

        var response = await _sut.GetAsync(groupWish.Id);

        response.Code.Should().Be(200);
        response.Data!.OrganizerName.Should().Be("Organizer");
    }

    [Fact]
    public async Task GetAsync_WhenStillCollecting_ReturnsConflict()
    {
        var groupWish = new GroupWish { Title = "T", RecipientName = "R", Status = GroupWishStatus.Collecting };
        _groupWishes.Setup(r => r.GetByIdAsync(groupWish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(groupWish);

        var response = await _sut.GetAsync(groupWish.Id);

        response.Code.Should().Be(409);
    }

    [Fact]
    public async Task GetAsync_WhenNotFound_ReturnsNotFound()
    {
        _groupWishes.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((GroupWish?)null);

        var response = await _sut.GetAsync(Guid.NewGuid());

        response.Code.Should().Be(404);
    }

    [Fact]
    public async Task GetAsync_WhenRepositoryThrows_ReturnsInternalError()
    {
        _groupWishes.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ThrowsAsync(new InvalidOperationException("db down"));

        var response = await _sut.GetAsync(Guid.NewGuid());

        response.Code.Should().Be(500);
    }
}
