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

public class PaymentServiceTests
{
    private readonly Mock<IRepository<Payment>> _payments = new();
    private readonly Mock<IRepository<Wish>> _wishes = new();
    private readonly PaymentService _sut;

    public PaymentServiceTests()
    {
        _sut = new PaymentService(_payments.Object, _wishes.Object, Mock.Of<ILogger<PaymentService>>());
    }

    private static Wish MakeWish(Guid customerUserId, WishStatus status = WishStatus.Draft) => new()
    {
        CustomerUserId = customerUserId,
        RecipientName = "Kojo",
        RecipientRelationship = "Brother",
        RecipientTimezone = "Africa/Accra",
        PriceLabel = "GH₵1.49",
        Status = status,
    };

    [Fact]
    public async Task InitiateAsync_WhenDraft_CreatesPaymentAndReturnsCreated()
    {
        var customerUserId = Guid.NewGuid();
        var wish = MakeWish(customerUserId);
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);

        var response = await _sut.InitiateAsync(customerUserId, wish.Id, new InitiatePaymentRequest("0551234567", PaymentProvider.Mtn));

        response.Code.Should().Be(201);
        response.Data!.Amount.Should().Be(1.49m);
        _payments.Verify(r => r.AddAsync(It.IsAny<Payment>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task InitiateAsync_WhenWishAlreadySealed_ReturnsConflict()
    {
        var customerUserId = Guid.NewGuid();
        var wish = MakeWish(customerUserId, WishStatus.Sealed);
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);

        var response = await _sut.InitiateAsync(customerUserId, wish.Id, new InitiatePaymentRequest("0551234567", PaymentProvider.Mtn));

        response.Code.Should().Be(409);
    }

    [Fact]
    public async Task InitiateAsync_WhenWishNotFound_ReturnsNotFound()
    {
        _wishes.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((Wish?)null);

        var response = await _sut.InitiateAsync(Guid.NewGuid(), Guid.NewGuid(), new InitiatePaymentRequest("0551234567", PaymentProvider.Mtn));

        response.Code.Should().Be(404);
    }

    [Fact]
    public async Task InitiateAsync_WhenRepositoryThrows_ReturnsInternalError()
    {
        _wishes.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ThrowsAsync(new InvalidOperationException("db down"));

        var response = await _sut.InitiateAsync(Guid.NewGuid(), Guid.NewGuid(), new InitiatePaymentRequest("0551234567", PaymentProvider.Mtn));

        response.Code.Should().Be(500);
    }

    [Fact]
    public async Task GetLatestAsync_WhenPaymentExists_ReturnsOk()
    {
        var customerUserId = Guid.NewGuid();
        var wish = MakeWish(customerUserId);
        var payment = new Payment { WishId = wish.Id, PhoneNumber = "0551234567", Provider = PaymentProvider.Mtn, Amount = 1.49m };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);
        _payments.Setup(r => r.FindManyAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Payment, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([payment]);

        var response = await _sut.GetLatestAsync(customerUserId, wish.Id);

        response.Code.Should().Be(200);
        response.Data!.Id.Should().Be(payment.Id);
    }

    [Fact]
    public async Task GetLatestAsync_WhenNoPaymentYet_ReturnsNotFound()
    {
        var customerUserId = Guid.NewGuid();
        var wish = MakeWish(customerUserId);
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);
        _payments.Setup(r => r.FindManyAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Payment, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        var response = await _sut.GetLatestAsync(customerUserId, wish.Id);

        response.Code.Should().Be(404);
    }

    [Fact]
    public async Task SimulateOutcomeAsync_WhenSucceed_SealsWishAndReturnsOk()
    {
        var customerUserId = Guid.NewGuid();
        var wish = MakeWish(customerUserId);
        var payment = new Payment { WishId = wish.Id, PhoneNumber = "0551234567", Provider = PaymentProvider.Mtn, Amount = 1.49m };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);
        _payments.Setup(r => r.GetByIdAsync(payment.Id, It.IsAny<CancellationToken>())).ReturnsAsync(payment);

        var response = await _sut.SimulateOutcomeAsync(customerUserId, wish.Id, payment.Id, new SimulatePaymentOutcomeRequest(true, null));

        response.Code.Should().Be(200);
        response.Data!.Status.Should().Be(PaymentStatus.Succeeded);
        wish.Status.Should().Be(WishStatus.Sealed);
    }

    [Fact]
    public async Task SimulateOutcomeAsync_WhenAlreadyResolved_ReturnsConflict()
    {
        var customerUserId = Guid.NewGuid();
        var wish = MakeWish(customerUserId);
        var payment = new Payment { WishId = wish.Id, PhoneNumber = "0551234567", Provider = PaymentProvider.Mtn, Amount = 1.49m, Status = PaymentStatus.Succeeded };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);
        _payments.Setup(r => r.GetByIdAsync(payment.Id, It.IsAny<CancellationToken>())).ReturnsAsync(payment);

        var response = await _sut.SimulateOutcomeAsync(customerUserId, wish.Id, payment.Id, new SimulatePaymentOutcomeRequest(true, null));

        response.Code.Should().Be(409);
    }

    [Fact]
    public async Task SimulateOutcomeAsync_WhenPaymentNotFound_ReturnsNotFound()
    {
        var customerUserId = Guid.NewGuid();
        var wish = MakeWish(customerUserId);
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);
        _payments.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((Payment?)null);

        var response = await _sut.SimulateOutcomeAsync(customerUserId, wish.Id, Guid.NewGuid(), new SimulatePaymentOutcomeRequest(true, null));

        response.Code.Should().Be(404);
    }

    [Fact]
    public async Task SimulateOutcomeAsync_WhenRepositoryThrows_ReturnsInternalError()
    {
        _wishes.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ThrowsAsync(new InvalidOperationException("db down"));

        var response = await _sut.SimulateOutcomeAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), new SimulatePaymentOutcomeRequest(true, null));

        response.Code.Should().Be(500);
    }
}
