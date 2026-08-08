using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using WishDem.Customer.Api.Models.Requests;
using WishDem.Customer.Api.Services;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;
using Xunit;

namespace WishDem.Customer.Api.Tests.Services;

public class ProfileServiceTests
{
    private readonly Mock<IRepository<CustomerUser>> _customerUsers = new();
    private readonly ProfileService _sut;

    public ProfileServiceTests()
    {
        _sut = new ProfileService(_customerUsers.Object, Mock.Of<ILogger<ProfileService>>());
    }

    [Fact]
    public async Task GetAsync_WhenUserExists_ReturnsOk()
    {
        var user = new CustomerUser { Email = "a@b.com", Name = "Existing Name", Country = "Ghana" };
        _customerUsers.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);

        var response = await _sut.GetAsync(user.Id);

        response.Code.Should().Be(200);
        response.Data!.Name.Should().Be("Existing Name");
        response.Data.Country.Should().Be("Ghana");
    }

    [Fact]
    public async Task GetAsync_WhenUserNotFound_ReturnsNotFound()
    {
        _customerUsers.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((CustomerUser?)null);

        var response = await _sut.GetAsync(Guid.NewGuid());

        response.Code.Should().Be(404);
    }

    [Fact]
    public async Task GetAsync_WhenRepositoryThrows_ReturnsInternalError()
    {
        _customerUsers.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ThrowsAsync(new InvalidOperationException("db down"));

        var response = await _sut.GetAsync(Guid.NewGuid());

        response.Code.Should().Be(500);
    }

    [Fact]
    public async Task UpdateAsync_WhenUserExists_UpdatesAndReturnsOk()
    {
        var user = new CustomerUser { Email = "a@b.com", Name = "Old Name" };
        _customerUsers.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);

        var request = new UpdateProfileRequest("New Name", "https://example.com/a.png", new DateOnly(1995, 5, 1), "Ghana", "Greater Accra");
        var response = await _sut.UpdateAsync(user.Id, request);

        response.Code.Should().Be(200);
        response.Data!.Name.Should().Be("New Name");
        response.Data.AvatarUrl.Should().Be("https://example.com/a.png");
        response.Data.Country.Should().Be("Ghana");
        _customerUsers.Verify(r => r.UpdateAsync(user, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WhenUserNotFound_ReturnsNotFound()
    {
        _customerUsers.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((CustomerUser?)null);

        var request = new UpdateProfileRequest("New Name", null, null, null, null);
        var response = await _sut.UpdateAsync(Guid.NewGuid(), request);

        response.Code.Should().Be(404);
    }

    [Fact]
    public async Task UpdateAsync_WhenRepositoryThrows_ReturnsInternalError()
    {
        _customerUsers.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ThrowsAsync(new InvalidOperationException("db down"));

        var request = new UpdateProfileRequest("New Name", null, null, null, null);
        var response = await _sut.UpdateAsync(Guid.NewGuid(), request);

        response.Code.Should().Be(500);
    }
}
