using System.Linq.Expressions;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using WishDem.Admin.Api.Interfaces;
using WishDem.Admin.Api.Services;
using WishDem.Common.Sdk.Enums;
using WishDem.Common.Sdk.Responses;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;
using Xunit;

namespace WishDem.Admin.Api.Tests.Services;

public class WishOversightServiceTests
{
    private readonly Mock<IRepository<Wish>> _wishes = new();
    private readonly Mock<IRepository<CustomerUser>> _customerUsers = new();
    private readonly WishOversightService _sut;

    public WishOversightServiceTests()
    {
        _sut = new WishOversightService(_wishes.Object, _customerUsers.Object, Mock.Of<IAuditLogService>(), Mock.Of<ILogger<WishOversightService>>());
    }

    private static Wish NewWish(Guid customerUserId) => new()
    {
        CustomerUserId = customerUserId,
        RecipientName = "Kojo",
        RecipientRelationship = "Brother",
        RecipientTimezone = "Africa/Accra",
        RecipientPhoneNumber = "0244123456",
    };

    [Fact]
    public async Task GetAllAsync_ReturnsPagedResultWithCustomerNames()
    {
        var customerUserId = Guid.NewGuid();
        var wish = NewWish(customerUserId);
        var customer = new CustomerUser { Id = customerUserId, Email = "kojo@wishdem.com", Name = "Kojo" };

        _wishes.Setup(r => r.GetPagedAsync(
                0, 20,
                It.IsAny<Expression<Func<Wish, bool>>>(),
                It.IsAny<Func<IQueryable<Wish>, IOrderedQueryable<Wish>>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PagedResult<Wish> { Items = [wish], PageIndex = 0, PageSize = 20, TotalCount = 1 });
        _customerUsers.Setup(r => r.FindManyAsync(It.IsAny<Expression<Func<CustomerUser, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([customer]);

        var response = await _sut.GetAllAsync(0, 20, null);

        response.Code.Should().Be(200);
        response.Data!.Items.Should().ContainSingle(w => w.CustomerName == "Kojo");
        // Admins need this to spot a wrong/malformed number when a customer reports a
        // delivery that never arrived — it must round-trip from the entity untouched.
        response.Data.Items.Single().RecipientPhoneNumber.Should().Be("0244123456");
    }

    [Fact]
    public async Task GetAllAsync_WhenRepositoryThrows_ReturnsInternalError()
    {
        _wishes.Setup(r => r.GetPagedAsync(
                It.IsAny<int>(), It.IsAny<int>(),
                It.IsAny<Expression<Func<Wish, bool>>>(),
                It.IsAny<Func<IQueryable<Wish>, IOrderedQueryable<Wish>>>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("db down"));

        var response = await _sut.GetAllAsync(0, 20, null);

        response.Code.Should().Be(500);
    }

    [Fact]
    public async Task GetByIdAsync_WhenWishExists_ReturnsOk()
    {
        var customerUserId = Guid.NewGuid();
        var wish = NewWish(customerUserId);
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);
        _customerUsers.Setup(r => r.GetByIdAsync(customerUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CustomerUser { Id = customerUserId, Email = "kojo@wishdem.com", Name = "Kojo" });

        var response = await _sut.GetByIdAsync(wish.Id);

        response.Code.Should().Be(200);
        response.Data!.Id.Should().Be(wish.Id);
    }

    [Fact]
    public async Task GetByIdAsync_WhenWishDoesNotExist_ReturnsNotFound()
    {
        _wishes.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((Wish?)null);

        var response = await _sut.GetByIdAsync(Guid.NewGuid());

        response.Code.Should().Be(404);
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenWishExists_UpdatesAndReturnsOk()
    {
        var customerUserId = Guid.NewGuid();
        var wish = NewWish(customerUserId);
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);
        _wishes.Setup(r => r.UpdateAsync(It.IsAny<Wish>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _customerUsers.Setup(r => r.GetByIdAsync(customerUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((CustomerUser?)null);

        var response = await _sut.UpdateStatusAsync(Guid.NewGuid(), wish.Id, WishStatus.Sealed);

        response.Code.Should().Be(200);
        response.Data!.Status.Should().Be(WishStatus.Sealed);
    }

    [Fact]
    public async Task UpdateStatusAsync_WhenWishDoesNotExist_ReturnsNotFound()
    {
        _wishes.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((Wish?)null);

        var response = await _sut.UpdateStatusAsync(Guid.NewGuid(), Guid.NewGuid(), WishStatus.Sealed);

        response.Code.Should().Be(404);
    }

    [Fact]
    public async Task DeleteAsync_WhenWishExists_RemovesAndReturnsOk()
    {
        var wish = NewWish(Guid.NewGuid());
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);
        _wishes.Setup(r => r.RemoveAsync(wish, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var response = await _sut.DeleteAsync(Guid.NewGuid(), wish.Id);

        response.Code.Should().Be(200);
        response.Data.Should().BeTrue();
        _wishes.Verify(r => r.RemoveAsync(wish, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_WhenWishDoesNotExist_ReturnsNotFound()
    {
        _wishes.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((Wish?)null);

        var response = await _sut.DeleteAsync(Guid.NewGuid(), Guid.NewGuid());

        response.Code.Should().Be(404);
    }

    [Fact]
    public async Task RedeliverAsync_ClearsDeliveredAndOpenedTimestamps()
    {
        var wish = NewWish(Guid.NewGuid());
        wish.DeliveredAtUtc = DateTime.UtcNow.AddDays(-1);
        wish.OpenedAtUtc = DateTime.UtcNow.AddHours(-1);
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);
        _wishes.Setup(r => r.UpdateAsync(It.IsAny<Wish>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _customerUsers.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((CustomerUser?)null);

        var response = await _sut.RedeliverAsync(Guid.NewGuid(), wish.Id);

        response.Code.Should().Be(200);
        wish.DeliveredAtUtc.Should().BeNull();
        wish.OpenedAtUtc.Should().BeNull();
    }

    [Fact]
    public async Task RedeliverAsync_WhenWishDoesNotExist_ReturnsNotFound()
    {
        _wishes.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((Wish?)null);

        var response = await _sut.RedeliverAsync(Guid.NewGuid(), Guid.NewGuid());

        response.Code.Should().Be(404);
    }
}
