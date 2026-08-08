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

public class CirclePersonServiceTests
{
    private readonly Mock<IRepository<CirclePerson>> _people = new();
    private readonly CirclePersonService _sut;

    public CirclePersonServiceTests()
    {
        _sut = new CirclePersonService(_people.Object, Mock.Of<ILogger<CirclePersonService>>());
    }

    private static SaveCirclePersonRequest ValidRequest() => new(
        Name: "Kojo",
        RelationshipLabel: "Brother",
        Group: CircleGroup.Family,
        Birthday: new DateOnly(1995, 5, 1),
        Timezone: "Africa/Accra",
        Note: "Loves chocolate cake");

    [Fact]
    public async Task GetMineAsync_ReturnsOwnedPeopleOrderedByName()
    {
        var customerUserId = Guid.NewGuid();
        var people = new List<CirclePerson>
        {
            new() { CustomerUserId = customerUserId, Name = "Zara", RelationshipLabel = "Friend" },
            new() { CustomerUserId = customerUserId, Name = "Ama", RelationshipLabel = "Sister" },
        };
        _people.Setup(r => r.FindManyAsync(It.IsAny<System.Linq.Expressions.Expression<Func<CirclePerson, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(people);

        var response = await _sut.GetMineAsync(customerUserId);

        response.Code.Should().Be(200);
        response.Data!.Select(p => p.Name).Should().ContainInOrder("Ama", "Zara");
    }

    [Fact]
    public async Task GetMineAsync_WhenRepositoryThrows_ReturnsInternalError()
    {
        _people.Setup(r => r.FindManyAsync(It.IsAny<System.Linq.Expressions.Expression<Func<CirclePerson, bool>>>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("db down"));

        var response = await _sut.GetMineAsync(Guid.NewGuid());

        response.Code.Should().Be(500);
    }

    [Fact]
    public async Task CreateAsync_ReturnsCreated()
    {
        var customerUserId = Guid.NewGuid();

        var response = await _sut.CreateAsync(customerUserId, ValidRequest());

        response.Code.Should().Be(201);
        response.Data!.Name.Should().Be("Kojo");
        _people.Verify(r => r.AddAsync(It.IsAny<CirclePerson>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WhenOwned_UpdatesAndReturnsOk()
    {
        var customerUserId = Guid.NewGuid();
        var person = new CirclePerson { CustomerUserId = customerUserId, Name = "Old", RelationshipLabel = "Friend" };
        _people.Setup(r => r.GetByIdAsync(person.Id, It.IsAny<CancellationToken>())).ReturnsAsync(person);

        var response = await _sut.UpdateAsync(customerUserId, person.Id, ValidRequest());

        response.Code.Should().Be(200);
        response.Data!.Name.Should().Be("Kojo");
    }

    [Fact]
    public async Task UpdateAsync_WhenBelongsToSomeoneElse_ReturnsNotFound()
    {
        var person = new CirclePerson { CustomerUserId = Guid.NewGuid(), Name = "Old", RelationshipLabel = "Friend" };
        _people.Setup(r => r.GetByIdAsync(person.Id, It.IsAny<CancellationToken>())).ReturnsAsync(person);

        var response = await _sut.UpdateAsync(Guid.NewGuid(), person.Id, ValidRequest());

        response.Code.Should().Be(404);
    }

    [Fact]
    public async Task UpdateAsync_WhenNotFound_ReturnsNotFound()
    {
        _people.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((CirclePerson?)null);

        var response = await _sut.UpdateAsync(Guid.NewGuid(), Guid.NewGuid(), ValidRequest());

        response.Code.Should().Be(404);
    }

    [Fact]
    public async Task UpdateAsync_WhenRepositoryThrows_ReturnsInternalError()
    {
        _people.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ThrowsAsync(new InvalidOperationException("db down"));

        var response = await _sut.UpdateAsync(Guid.NewGuid(), Guid.NewGuid(), ValidRequest());

        response.Code.Should().Be(500);
    }

    [Fact]
    public async Task DeleteAsync_WhenOwned_RemovesAndReturnsOk()
    {
        var customerUserId = Guid.NewGuid();
        var person = new CirclePerson { CustomerUserId = customerUserId, Name = "Kojo", RelationshipLabel = "Brother" };
        _people.Setup(r => r.GetByIdAsync(person.Id, It.IsAny<CancellationToken>())).ReturnsAsync(person);

        var response = await _sut.DeleteAsync(customerUserId, person.Id);

        response.Code.Should().Be(200);
        response.Data.Should().BeTrue();
        _people.Verify(r => r.RemoveAsync(person, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WhenNotFound_ReturnsNotFound()
    {
        _people.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((CirclePerson?)null);

        var response = await _sut.DeleteAsync(Guid.NewGuid(), Guid.NewGuid());

        response.Code.Should().Be(404);
    }
}
