using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using WishDem.Common.Sdk.Enums;
using WishDem.Customer.Api.Models.Requests;
using WishDem.Customer.Api.Services;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;
using Xunit;

namespace WishDem.Customer.Api.Tests.Services;

public class GroupWishServiceTests
{
    private readonly Mock<IRepository<GroupWish>> _groupWishes = new();
    private readonly Mock<IRepository<GroupWishInvitation>> _invitations = new();
    private readonly Mock<IRepository<GroupWishMemory>> _memories = new();
    private readonly GroupWishService _sut;

    public GroupWishServiceTests()
    {
        _sut = new GroupWishService(_groupWishes.Object, _invitations.Object, _memories.Object, Mock.Of<ILogger<GroupWishService>>());

        _invitations.Setup(r => r.FindManyAsync(It.IsAny<System.Linq.Expressions.Expression<Func<GroupWishInvitation, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        _memories.Setup(r => r.FindManyAsync(It.IsAny<System.Linq.Expressions.Expression<Func<GroupWishMemory, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
    }

    private static CreateGroupWishRequest ValidRequest() => new(
        Title: "Surprise Party",
        RecipientName: "Yaw",
        Occasion: "Birthday",
        DeliveryDate: new DateOnly(2026, 5, 1),
        CollectByDate: new DateOnly(2026, 4, 20),
        Context: "Turning 30",
        OrganizerNote: "Let's make it special",
        Formats: [MemoryFormat.Notes, MemoryFormat.Photo],
        NamesVisible: true);

    [Fact]
    public async Task CreateAsync_ReturnsCreated()
    {
        var organizerId = Guid.NewGuid();

        var response = await _sut.CreateAsync(organizerId, ValidRequest());

        response.Code.Should().Be(201);
        response.Data!.Title.Should().Be("Surprise Party");
        _groupWishes.Verify(r => r.AddAsync(It.IsAny<GroupWish>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetByIdAsync_WhenOwned_ReturnsOk()
    {
        var organizerId = Guid.NewGuid();
        var groupWish = new GroupWish { OrganizerCustomerUserId = organizerId, Title = "T", RecipientName = "R" };
        _groupWishes.Setup(r => r.GetByIdAsync(groupWish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(groupWish);

        var response = await _sut.GetByIdAsync(organizerId, groupWish.Id);

        response.Code.Should().Be(200);
    }

    [Fact]
    public async Task GetByIdAsync_WhenBelongsToSomeoneElse_ReturnsNotFound()
    {
        var groupWish = new GroupWish { OrganizerCustomerUserId = Guid.NewGuid(), Title = "T", RecipientName = "R" };
        _groupWishes.Setup(r => r.GetByIdAsync(groupWish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(groupWish);

        var response = await _sut.GetByIdAsync(Guid.NewGuid(), groupWish.Id);

        response.Code.Should().Be(404);
    }

    [Fact]
    public async Task GetByIdAsync_WhenRepositoryThrows_ReturnsInternalError()
    {
        _groupWishes.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ThrowsAsync(new InvalidOperationException("db down"));

        var response = await _sut.GetByIdAsync(Guid.NewGuid(), Guid.NewGuid());

        response.Code.Should().Be(500);
    }

    [Fact]
    public async Task InviteAsync_WhenCollecting_ReturnsCreated()
    {
        var organizerId = Guid.NewGuid();
        var groupWish = new GroupWish { OrganizerCustomerUserId = organizerId, Title = "T", RecipientName = "R", Status = GroupWishStatus.Collecting };
        _groupWishes.Setup(r => r.GetByIdAsync(groupWish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(groupWish);

        var response = await _sut.InviteAsync(organizerId, groupWish.Id, new InviteGuestRequest("Ama", "ama@example.com"));

        response.Code.Should().Be(201);
        response.Data!.GuestName.Should().Be("Ama");
    }

    [Fact]
    public async Task InviteAsync_WhenNotCollecting_ReturnsConflict()
    {
        var organizerId = Guid.NewGuid();
        var groupWish = new GroupWish { OrganizerCustomerUserId = organizerId, Title = "T", RecipientName = "R", Status = GroupWishStatus.Sealed };
        _groupWishes.Setup(r => r.GetByIdAsync(groupWish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(groupWish);

        var response = await _sut.InviteAsync(organizerId, groupWish.Id, new InviteGuestRequest("Ama", "ama@example.com"));

        response.Code.Should().Be(409);
    }

    [Fact]
    public async Task SealAsync_WhenCollecting_SealsAndReturnsOk()
    {
        var organizerId = Guid.NewGuid();
        var groupWish = new GroupWish { OrganizerCustomerUserId = organizerId, Title = "T", RecipientName = "R", Status = GroupWishStatus.Collecting };
        _groupWishes.Setup(r => r.GetByIdAsync(groupWish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(groupWish);

        var response = await _sut.SealAsync(organizerId, groupWish.Id);

        response.Code.Should().Be(200);
        response.Data!.Status.Should().Be(GroupWishStatus.Sealed);
    }

    [Fact]
    public async Task SealAsync_WhenAlreadySealed_ReturnsConflict()
    {
        var organizerId = Guid.NewGuid();
        var groupWish = new GroupWish { OrganizerCustomerUserId = organizerId, Title = "T", RecipientName = "R", Status = GroupWishStatus.Sealed };
        _groupWishes.Setup(r => r.GetByIdAsync(groupWish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(groupWish);

        var response = await _sut.SealAsync(organizerId, groupWish.Id);

        response.Code.Should().Be(409);
    }

    [Fact]
    public async Task DeleteAsync_WhenOwned_RemovesAndReturnsOk()
    {
        var organizerId = Guid.NewGuid();
        var groupWish = new GroupWish { OrganizerCustomerUserId = organizerId, Title = "T", RecipientName = "R" };
        _groupWishes.Setup(r => r.GetByIdAsync(groupWish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(groupWish);

        var response = await _sut.DeleteAsync(organizerId, groupWish.Id);

        response.Code.Should().Be(200);
        response.Data.Should().BeTrue();
        _groupWishes.Verify(r => r.RemoveAsync(groupWish, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WhenNotFound_ReturnsNotFound()
    {
        _groupWishes.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((GroupWish?)null);

        var response = await _sut.DeleteAsync(Guid.NewGuid(), Guid.NewGuid());

        response.Code.Should().Be(404);
    }
}
