using System.Linq.Expressions;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using WishDem.Admin.Api.Models.Requests;
using WishDem.Admin.Api.Services;
using WishDem.Common.Sdk.Enums;
using WishDem.Common.Sdk.Responses;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;
using Xunit;

namespace WishDem.Admin.Api.Tests.Services;

public class PaymentOversightServiceTests
{
    private readonly Mock<IRepository<Payment>> _payments = new();
    private readonly Mock<IRepository<Wish>> _wishes = new();
    private readonly Mock<IRepository<CustomerUser>> _customerUsers = new();
    private readonly PaymentOversightService _sut;

    public PaymentOversightServiceTests()
    {
        _sut = new PaymentOversightService(_payments.Object, _wishes.Object, _customerUsers.Object, Mock.Of<ILogger<PaymentOversightService>>());
    }

    private static Payment NewPayment(Guid wishId, PaymentStatus status = PaymentStatus.Succeeded) => new()
    {
        WishId = wishId,
        PhoneNumber = "0244000000",
        Provider = PaymentProvider.Mtn,
        Amount = 1.49m,
        Status = status,
    };

    [Fact]
    public async Task GetAllAsync_ReturnsPagedResult()
    {
        var wishId = Guid.NewGuid();
        var payment = NewPayment(wishId);
        _payments.Setup(r => r.GetPagedAsync(
                0, 20,
                It.IsAny<Expression<Func<Payment, bool>>>(),
                It.IsAny<Func<IQueryable<Payment>, IOrderedQueryable<Payment>>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PagedResult<Payment> { Items = [payment], PageIndex = 0, PageSize = 20, TotalCount = 1 });
        _wishes.Setup(r => r.FindManyAsync(It.IsAny<Expression<Func<Wish, bool>>>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);
        _customerUsers.Setup(r => r.FindManyAsync(It.IsAny<Expression<Func<CustomerUser, bool>>>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);

        var response = await _sut.GetAllAsync(0, 20, null);

        response.Code.Should().Be(200);
        response.Data!.TotalCount.Should().Be(1);
    }

    [Fact]
    public async Task GetAllAsync_WhenRepositoryThrows_ReturnsInternalError()
    {
        _payments.Setup(r => r.GetPagedAsync(
                It.IsAny<int>(), It.IsAny<int>(),
                It.IsAny<Expression<Func<Payment, bool>>>(),
                It.IsAny<Func<IQueryable<Payment>, IOrderedQueryable<Payment>>>(),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("db down"));

        var response = await _sut.GetAllAsync(0, 20, null);

        response.Code.Should().Be(500);
    }

    [Fact]
    public async Task GetByIdAsync_WhenPaymentDoesNotExist_ReturnsNotFound()
    {
        _payments.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((Payment?)null);

        var response = await _sut.GetByIdAsync(Guid.NewGuid());

        response.Code.Should().Be(404);
    }

    [Fact]
    public async Task GetByIdAsync_FlagsReconciliationMismatch_WhenWishIsStillDraft()
    {
        var wishId = Guid.NewGuid();
        var payment = NewPayment(wishId);
        var wish = new Wish { Id = wishId, CustomerUserId = Guid.NewGuid(), RecipientName = "Kojo", RecipientRelationship = "Brother", RecipientTimezone = "Africa/Accra", Status = WishStatus.Draft };

        _payments.Setup(r => r.GetByIdAsync(payment.Id, It.IsAny<CancellationToken>())).ReturnsAsync(payment);
        _wishes.Setup(r => r.GetByIdAsync(wishId, It.IsAny<CancellationToken>())).ReturnsAsync(wish);
        _customerUsers.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((CustomerUser?)null);

        var response = await _sut.GetByIdAsync(payment.Id);

        response.Code.Should().Be(200);
        response.Data!.ReconciliationMismatch.Should().BeTrue();
    }

    [Fact]
    public async Task RefundAsync_WhenPaymentSucceeded_MarksReversed()
    {
        var wishId = Guid.NewGuid();
        var payment = NewPayment(wishId);
        _payments.Setup(r => r.GetByIdAsync(payment.Id, It.IsAny<CancellationToken>())).ReturnsAsync(payment);
        _payments.Setup(r => r.UpdateAsync(It.IsAny<Payment>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _wishes.Setup(r => r.GetByIdAsync(wishId, It.IsAny<CancellationToken>())).ReturnsAsync((Wish?)null);

        var response = await _sut.RefundAsync(payment.Id, new RefundPaymentRequest(1.49m, "Customer requested refund"));

        response.Code.Should().Be(200);
        payment.Status.Should().Be(PaymentStatus.Reversed);
        payment.RefundAmount.Should().Be(1.49m);
    }

    [Fact]
    public async Task RefundAsync_WhenPaymentNotSucceeded_ReturnsConflict()
    {
        var payment = NewPayment(Guid.NewGuid(), PaymentStatus.Failed);
        _payments.Setup(r => r.GetByIdAsync(payment.Id, It.IsAny<CancellationToken>())).ReturnsAsync(payment);

        var response = await _sut.RefundAsync(payment.Id, new RefundPaymentRequest(1.49m, "reason"));

        response.Code.Should().Be(409);
    }

    [Fact]
    public async Task RefundAsync_WhenPaymentDoesNotExist_ReturnsNotFound()
    {
        _payments.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((Payment?)null);

        var response = await _sut.RefundAsync(Guid.NewGuid(), new RefundPaymentRequest(1.49m, "reason"));

        response.Code.Should().Be(404);
    }
}
