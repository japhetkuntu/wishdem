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

public class CustomerProfileServiceTests
{
    private readonly Mock<IRepository<CustomerUser>> _customerUsers = new();
    private readonly Mock<IRepository<Wish>> _wishes = new();
    private readonly Mock<IRepository<Payment>> _payments = new();
    private readonly CustomerProfileService _sut;

    public CustomerProfileServiceTests()
    {
        _sut = new CustomerProfileService(_customerUsers.Object, _wishes.Object, _payments.Object, Mock.Of<ILogger<CustomerProfileService>>());
    }

    [Fact]
    public async Task GetProfileAsync_WhenCustomerExists_ReturnsProfileWithWishAndPaymentTotals()
    {
        var customer = new CustomerUser { Email = "kojo@wishdem.com", Name = "Kojo" };
        var sealedWish = new Wish { CustomerUserId = customer.Id, RecipientName = "Ama", RecipientRelationship = "Sister", RecipientTimezone = "Africa/Accra", Status = WishStatus.Sealed };
        var draftWish = new Wish { CustomerUserId = customer.Id, RecipientName = "Yaw", RecipientRelationship = "Friend", RecipientTimezone = "Africa/Accra", Status = WishStatus.Draft };

        _customerUsers.Setup(r => r.GetByIdAsync(customer.Id, It.IsAny<CancellationToken>())).ReturnsAsync(customer);
        _wishes.Setup(r => r.FindManyAsync(It.IsAny<Expression<Func<Wish, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([sealedWish, draftWish]);
        _payments.Setup(r => r.FindManyAsync(It.IsAny<Expression<Func<Payment, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([new Payment { WishId = sealedWish.Id, PhoneNumber = "0244000000", Provider = PaymentProvider.Mtn, Amount = 1.49m, Status = PaymentStatus.Succeeded }]);

        var response = await _sut.GetProfileAsync(customer.Id);

        response.Code.Should().Be(200);
        response.Data!.TotalWishCount.Should().Be(2);
        response.Data.WishCountByStatus[WishStatus.Sealed].Should().Be(1);
        response.Data.WishCountByStatus[WishStatus.Draft].Should().Be(1);
        response.Data.TotalAmountPaid.Should().Be(1.49m);
    }

    [Fact]
    public async Task GetProfileAsync_WhenCustomerDoesNotExist_ReturnsNotFound()
    {
        _customerUsers.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((CustomerUser?)null);

        var response = await _sut.GetProfileAsync(Guid.NewGuid());

        response.Code.Should().Be(404);
    }

    [Fact]
    public async Task GetProfileAsync_WhenRepositoryThrows_ReturnsInternalError()
    {
        _customerUsers.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("db down"));

        var response = await _sut.GetProfileAsync(Guid.NewGuid());

        response.Code.Should().Be(500);
    }
}
