using System.IO;
using System.Linq.Expressions;
using System.Text;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using WishDem.Actors.Sdk.Configuration;
using WishDem.Cache.Sdk.Services;
using WishDem.Common.Sdk.Enums;
using WishDem.Common.Sdk.Responses;
using WishDem.Customer.Api.Models.Requests;
using WishDem.Customer.Api.Services;
using WishDem.Messaging.Sdk.Abstractions;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;
using WishDem.Storage.Sdk;
using Xunit;

namespace WishDem.Customer.Api.Tests.Services;

public class WishServiceTests
{
    private readonly Mock<IRepository<Wish>> _wishes = new();
    private readonly Mock<IRepository<CustomerUser>> _customerUsers = new();
    private readonly Mock<IStorageService> _storageService = new();
    private readonly Mock<ICacheService> _cache = new();
    private readonly Mock<IEmailSender> _emailSender = new();
    private readonly WishService _sut;

    public WishServiceTests()
    {
        _storageService.Setup(s => s.BuildPublicUrl(It.IsAny<string>()))
            .Returns((string key) => $"http://localhost:9000/wishdem/{key}");

        // Cache-miss by default so the daily-limit checks fall through to the Postgres count
        // each test already mocks via _wishes.FindManyAsync — tests that care about the cache
        // itself override this explicitly.
        _cache.Setup(c => c.GetAsync<int?>(It.IsAny<string>())).ReturnsAsync((int?)null);
        _cache.Setup(c => c.IncrementAsync(It.IsAny<string>(), It.IsAny<TimeSpan?>())).ReturnsAsync(1);

        var deliverySettings = Options.Create(new DeliverySettings { FrontendBaseUrl = "http://localhost:5173" });
        _sut = new WishService(
            _wishes.Object, _customerUsers.Object, _storageService.Object, _cache.Object,
            _emailSender.Object, deliverySettings, Mock.Of<ILogger<WishService>>());
    }

    private static SaveWishRequest ValidRequest() => new(
        FromName: "Ama",
        RecipientName: "Kojo",
        RecipientRelationship: "Brother",
        Occasion: OccasionType.Birthday,
        OccasionLabel: null,
        RecipientOccasionDate: new DateOnly(2000, 1, 1),
        DeliveryTime: new TimeOnly(9, 0),
        RecipientTimezone: "Africa/Accra",
        RecipientPhoneNumber: "0244123456",
        Message: "Happy birthday!",
        AttachmentKind: null,
        AttachmentUrl: null,
        AttachmentDurationSeconds: null,
        ThemeId: "confetti",
        Channel: DeliveryChannel.WhatsApp);

    [Fact]
    public async Task GetByIdAsync_WhenWishIsOwnedByCaller_ReturnsOk()
    {
        var customerUserId = Guid.NewGuid();
        var wish = new Wish
        {
            CustomerUserId = customerUserId,
            RecipientName = "Kojo",
            RecipientRelationship = "Brother",
            RecipientTimezone = "Africa/Accra",
        };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);

        var response = await _sut.GetByIdAsync(customerUserId, wish.Id);

        response.Code.Should().Be(200);
        response.Data!.Id.Should().Be(wish.Id);
    }

    [Fact]
    public async Task GetByIdAsync_WhenWishBelongsToSomeoneElse_ReturnsNotFound()
    {
        var wish = new Wish
        {
            CustomerUserId = Guid.NewGuid(),
            RecipientName = "Kojo",
            RecipientRelationship = "Brother",
            RecipientTimezone = "Africa/Accra",
        };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);

        var response = await _sut.GetByIdAsync(Guid.NewGuid(), wish.Id);

        response.Code.Should().Be(404);
    }

    [Fact]
    public async Task GetByIdAsync_WhenWishDoesNotExist_ReturnsNotFound()
    {
        _wishes.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((Wish?)null);

        var response = await _sut.GetByIdAsync(Guid.NewGuid(), Guid.NewGuid());

        response.Code.Should().Be(404);
    }

    [Fact]
    public async Task GetByIdAsync_WhenRepositoryThrows_ReturnsInternalError()
    {
        _wishes.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("db down"));

        var response = await _sut.GetByIdAsync(Guid.NewGuid(), Guid.NewGuid());

        response.Code.Should().Be(500);
    }

    [Fact]
    public async Task CreateAsync_ReturnsCreatedWithDraftStatus()
    {
        var customerUserId = Guid.NewGuid();
        _wishes.Setup(r => r.FindManyAsync(It.IsAny<Expression<Func<Wish, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        _wishes.Setup(r => r.AddAsync(It.IsAny<Wish>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var response = await _sut.CreateAsync(customerUserId, ValidRequest());

        response.Code.Should().Be(201);
        response.Data!.Status.Should().Be(WishStatus.Draft);
        response.Data.RecipientName.Should().Be("Kojo");
        response.Data.RecipientPhoneNumber.Should().Be("0244123456");
    }

    [Fact]
    public async Task CreateAsync_WhenUnderDailyLimit_Succeeds()
    {
        var customerUserId = Guid.NewGuid();
        var alreadyCreatedToday = Enumerable.Range(0, 2)
            .Select(_ => new Wish { CustomerUserId = customerUserId, RecipientName = "Kojo", RecipientRelationship = "Brother", RecipientTimezone = "Africa/Accra" })
            .ToList();
        _wishes.Setup(r => r.FindManyAsync(It.IsAny<Expression<Func<Wish, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(alreadyCreatedToday);
        _wishes.Setup(r => r.AddAsync(It.IsAny<Wish>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var response = await _sut.CreateAsync(customerUserId, ValidRequest());

        response.Code.Should().Be(201);
    }

    [Fact]
    public async Task CreateAsync_WhenAtDailyLimit_ReturnsTooManyRequests()
    {
        var customerUserId = Guid.NewGuid();
        var alreadyCreatedToday = Enumerable.Range(0, 15)
            .Select(_ => new Wish { CustomerUserId = customerUserId, RecipientName = "Kojo", RecipientRelationship = "Brother", RecipientTimezone = "Africa/Accra" })
            .ToList();
        _wishes.Setup(r => r.FindManyAsync(It.IsAny<Expression<Func<Wish, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(alreadyCreatedToday);

        var response = await _sut.CreateAsync(customerUserId, ValidRequest());

        response.Code.Should().Be(429);
        _wishes.Verify(r => r.AddAsync(It.IsAny<Wish>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GetDailyLimitAsync_ReturnsUsedMaxAndRemaining()
    {
        var customerUserId = Guid.NewGuid();
        var alreadyCreatedToday = Enumerable.Range(0, 2)
            .Select(_ => new Wish { CustomerUserId = customerUserId, RecipientName = "Kojo", RecipientRelationship = "Brother", RecipientTimezone = "Africa/Accra" })
            .ToList();
        _wishes.Setup(r => r.FindManyAsync(It.IsAny<Expression<Func<Wish, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(alreadyCreatedToday);

        var response = await _sut.GetDailyLimitAsync(customerUserId);

        response.Code.Should().Be(200);
        response.Data!.Used.Should().Be(2);
        response.Data.Max.Should().Be(15);
        response.Data.Remaining.Should().Be(13);
    }

    [Fact]
    public async Task GetDailyLimitAsync_WhenRepositoryThrows_ReturnsInternalError()
    {
        var customerUserId = Guid.NewGuid();
        _wishes.Setup(r => r.FindManyAsync(It.IsAny<Expression<Func<Wish, bool>>>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("db down"));

        var response = await _sut.GetDailyLimitAsync(customerUserId);

        response.Code.Should().Be(500);
    }

    [Fact]
    public async Task GetDailyLimitAsync_WhenCacheHasCount_NeverQueriesPostgres()
    {
        var customerUserId = Guid.NewGuid();
        _cache.Setup(c => c.GetAsync<int?>(It.IsAny<string>())).ReturnsAsync(2);

        var response = await _sut.GetDailyLimitAsync(customerUserId);

        response.Code.Should().Be(200);
        response.Data!.Used.Should().Be(2);
        _wishes.Verify(r => r.FindManyAsync(It.IsAny<Expression<Func<Wish, bool>>>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GetDailyLimitAsync_WhenCacheMisses_SeedsCacheFromPostgresCount()
    {
        var customerUserId = Guid.NewGuid();
        var alreadyCreatedToday = Enumerable.Range(0, 2)
            .Select(_ => new Wish { CustomerUserId = customerUserId, RecipientName = "Kojo", RecipientRelationship = "Brother", RecipientTimezone = "Africa/Accra" })
            .ToList();
        _wishes.Setup(r => r.FindManyAsync(It.IsAny<Expression<Func<Wish, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(alreadyCreatedToday);

        await _sut.GetDailyLimitAsync(customerUserId);

        _cache.Verify(c => c.SetAsync(It.IsAny<string>(), 2, It.IsAny<TimeSpan?>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_OnSuccess_IncrementsTheCachedDailyCount()
    {
        var customerUserId = Guid.NewGuid();
        _wishes.Setup(r => r.FindManyAsync(It.IsAny<Expression<Func<Wish, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        _wishes.Setup(r => r.AddAsync(It.IsAny<Wish>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);

        await _sut.CreateAsync(customerUserId, ValidRequest());

        _cache.Verify(c => c.IncrementAsync(It.IsAny<string>(), It.IsAny<TimeSpan?>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_WhenAlreadySealed_ReturnsConflict()
    {
        var customerUserId = Guid.NewGuid();
        var wish = new Wish
        {
            CustomerUserId = customerUserId,
            RecipientName = "Kojo",
            RecipientRelationship = "Brother",
            RecipientTimezone = "Africa/Accra",
            Status = WishStatus.Sealed,
        };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);

        var response = await _sut.UpdateAsync(customerUserId, wish.Id, ValidRequest());

        response.Code.Should().Be(409);
        _wishes.Verify(r => r.UpdateAsync(It.IsAny<Wish>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task SealAsync_WhenDraft_SealsAndReturnsOk()
    {
        var customerUserId = Guid.NewGuid();
        var wish = new Wish
        {
            CustomerUserId = customerUserId,
            RecipientName = "Kojo",
            RecipientRelationship = "Brother",
            RecipientTimezone = "Africa/Accra",
        };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);
        _wishes.Setup(r => r.UpdateAsync(It.IsAny<Wish>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var response = await _sut.SealAsync(customerUserId, wish.Id, new SealWishRequest(null));

        response.Code.Should().Be(200);
        response.Data!.Status.Should().Be(WishStatus.Sealed);
        response.Data.SealedAtUtc.Should().NotBeNull();
    }

    [Fact]
    public async Task SealAsync_WhenAlreadySealed_ReturnsConflict()
    {
        var customerUserId = Guid.NewGuid();
        var wish = new Wish
        {
            CustomerUserId = customerUserId,
            RecipientName = "Kojo",
            RecipientRelationship = "Brother",
            RecipientTimezone = "Africa/Accra",
            Status = WishStatus.Sealed,
        };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);

        var response = await _sut.SealAsync(customerUserId, wish.Id, new SealWishRequest(null));

        response.Code.Should().Be(409);
    }

    [Fact]
    public async Task DeleteAsync_WhenOwned_RemovesAndReturnsOk()
    {
        var customerUserId = Guid.NewGuid();
        var wish = new Wish
        {
            CustomerUserId = customerUserId,
            RecipientName = "Kojo",
            RecipientRelationship = "Brother",
            RecipientTimezone = "Africa/Accra",
        };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);
        _wishes.Setup(r => r.RemoveAsync(wish, It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var response = await _sut.DeleteAsync(customerUserId, wish.Id);

        response.Code.Should().Be(200);
        response.Data.Should().BeTrue();
        _wishes.Verify(r => r.RemoveAsync(wish, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetMyWishesAsync_ReturnsPagedResultWrappedInOk()
    {
        var customerUserId = Guid.NewGuid();
        var paged = new PagedResult<Wish>
        {
            Items = [new Wish { CustomerUserId = customerUserId, RecipientName = "Kojo", RecipientRelationship = "Brother", RecipientTimezone = "Africa/Accra" }],
            PageIndex = 0,
            PageSize = 20,
            TotalCount = 1,
        };
        _wishes.Setup(r => r.GetPagedAsync(
                0, 20,
                It.IsAny<Expression<Func<Wish, bool>>>(),
                It.IsAny<Func<IQueryable<Wish>, IOrderedQueryable<Wish>>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(paged);

        var response = await _sut.GetMyWishesAsync(customerUserId, 0, 20);

        response.Code.Should().Be(200);
        response.Data!.TotalCount.Should().Be(1);
        response.Data.Items.Should().ContainSingle();
    }

    [Fact]
    public async Task GetPublicAsync_WhenSealed_ReturnsOk()
    {
        var wish = new Wish
        {
            RecipientName = "Kojo",
            RecipientRelationship = "Brother",
            RecipientTimezone = "Africa/Accra",
            Status = WishStatus.Sealed,
        };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);

        var response = await _sut.GetPublicAsync(wish.Id);

        response.Code.Should().Be(200);
        response.Data!.Id.Should().Be(wish.Id);
    }

    [Fact]
    public async Task GetPublicAsync_WhenNotYetOpened_HidesMessageAndAttachment()
    {
        var wish = new Wish
        {
            RecipientName = "Kojo",
            RecipientRelationship = "Brother",
            RecipientTimezone = "Africa/Accra",
            Message = "Happy birthday, this is a surprise!",
            AttachmentKind = AttachmentKind.Image,
            AttachmentUrl = "https://cdn.example.com/photo.png",
            AttachmentDurationSeconds = null,
            Status = WishStatus.Sealed,
        };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);

        var response = await _sut.GetPublicAsync(wish.Id);

        response.Data!.Message.Should().BeEmpty();
        response.Data.AttachmentKind.Should().BeNull();
        response.Data.AttachmentUrl.Should().BeNull();
    }

    [Fact]
    public async Task GetPublicAsync_WhenAlreadyOpened_ReturnsFullContent()
    {
        var wish = new Wish
        {
            RecipientName = "Kojo",
            RecipientRelationship = "Brother",
            RecipientTimezone = "Africa/Accra",
            Message = "Happy birthday, this is a surprise!",
            AttachmentUrl = "https://cdn.example.com/photo.png",
            Status = WishStatus.Opened,
            OpenedAtUtc = DateTime.UtcNow,
        };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);

        var response = await _sut.GetPublicAsync(wish.Id);

        response.Data!.Message.Should().Be("Happy birthday, this is a surprise!");
        response.Data.AttachmentUrl.Should().Be("https://cdn.example.com/photo.png");
    }

    [Fact]
    public async Task GetPublicAsync_WhenDraft_ReturnsNotFound()
    {
        var wish = new Wish
        {
            RecipientName = "Kojo",
            RecipientRelationship = "Brother",
            RecipientTimezone = "Africa/Accra",
            Status = WishStatus.Draft,
        };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);

        var response = await _sut.GetPublicAsync(wish.Id);

        response.Code.Should().Be(404);
    }

    [Fact]
    public async Task GetPublicAsync_WhenNotFound_ReturnsNotFound()
    {
        _wishes.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((Wish?)null);

        var response = await _sut.GetPublicAsync(Guid.NewGuid());

        response.Code.Should().Be(404);
    }

    [Fact]
    public async Task GetPublicAsync_WhenRepositoryThrows_ReturnsInternalError()
    {
        _wishes.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ThrowsAsync(new InvalidOperationException("db down"));

        var response = await _sut.GetPublicAsync(Guid.NewGuid());

        response.Code.Should().Be(500);
    }

    [Fact]
    public async Task MarkOpenedAsync_WhenSealed_MarksOpenedAndStampsDelivery()
    {
        var wish = new Wish
        {
            RecipientName = "Kojo",
            RecipientRelationship = "Brother",
            RecipientTimezone = "Africa/Accra",
            Message = "Happy birthday, this is a surprise!",
            Status = WishStatus.Sealed,
            RecipientOccasionDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)),
            DeliveryTime = new TimeOnly(0, 0),
            SealedAtUtc = DateTime.UtcNow.AddDays(-10),
        };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);

        var response = await _sut.MarkOpenedAsync(wish.Id);

        response.Code.Should().Be(200);
        response.Data!.Status.Should().Be(WishStatus.Opened);
        response.Data.OpenedAtUtc.Should().NotBeNull();
        response.Data.DeliveredAtUtc.Should().NotBeNull();
        // This is the actual "break the seal" reveal — unlike GetPublicAsync, it must return
        // the real message, not a blanked-out one.
        response.Data.Message.Should().Be("Happy birthday, this is a surprise!");
        _wishes.Verify(r => r.UpdateAsync(wish, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task MarkOpenedAsync_WhenAlreadyOpened_IsIdempotentAndReturnsOk()
    {
        var openedAt = DateTime.UtcNow.AddHours(-1);
        var wish = new Wish
        {
            RecipientName = "Kojo",
            RecipientRelationship = "Brother",
            RecipientTimezone = "Africa/Accra",
            Status = WishStatus.Opened,
            OpenedAtUtc = openedAt,
            DeliveredAtUtc = openedAt,
        };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);

        var response = await _sut.MarkOpenedAsync(wish.Id);

        response.Code.Should().Be(200);
        response.Data!.OpenedAtUtc.Should().Be(openedAt);
        _wishes.Verify(r => r.UpdateAsync(It.IsAny<Wish>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task MarkOpenedAsync_WhenDraft_ReturnsNotFound()
    {
        var wish = new Wish
        {
            RecipientName = "Kojo",
            RecipientRelationship = "Brother",
            RecipientTimezone = "Africa/Accra",
            Status = WishStatus.Draft,
        };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);

        var response = await _sut.MarkOpenedAsync(wish.Id);

        response.Code.Should().Be(404);
    }

    [Fact]
    public async Task MarkOpenedAsync_WhenRepositoryThrows_ReturnsInternalError()
    {
        _wishes.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ThrowsAsync(new InvalidOperationException("db down"));

        var response = await _sut.MarkOpenedAsync(Guid.NewGuid());

        response.Code.Should().Be(500);
    }

    [Fact]
    public async Task MarkOpenedAsync_WhenSealed_NotifiesSenderByEmail()
    {
        var customerUserId = Guid.NewGuid();
        var wish = new Wish
        {
            CustomerUserId = customerUserId,
            RecipientName = "Kojo",
            RecipientRelationship = "Brother",
            RecipientTimezone = "Africa/Accra",
            Status = WishStatus.Sealed,
            RecipientOccasionDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)),
            DeliveryTime = new TimeOnly(0, 0),
            SealedAtUtc = DateTime.UtcNow.AddDays(-10),
        };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);
        _customerUsers.Setup(r => r.GetByIdAsync(customerUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CustomerUser { Id = customerUserId, Email = "sender@example.com", Name = "Ama" });

        await _sut.MarkOpenedAsync(wish.Id);

        _emailSender.Verify(e => e.SendAsync("sender@example.com", It.Is<string>(s => s.Contains("Kojo")), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task MarkOpenedAsync_WhenSealedButNotYetDue_ReturnsConflictAndDoesNotOpen()
    {
        var wish = new Wish
        {
            RecipientName = "Kojo",
            RecipientRelationship = "Brother",
            RecipientTimezone = "Africa/Accra",
            Message = "Happy birthday, this is a surprise!",
            Status = WishStatus.Sealed,
            // Sealed moments ago, occasion is weeks away — nowhere near due.
            RecipientOccasionDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
            DeliveryTime = new TimeOnly(9, 0),
            SealedAtUtc = DateTime.UtcNow,
        };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);

        var response = await _sut.MarkOpenedAsync(wish.Id);

        response.Code.Should().Be(409);
        wish.Status.Should().Be(WishStatus.Sealed);
        _wishes.Verify(r => r.UpdateAsync(It.IsAny<Wish>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task MarkOpenedAsync_WhenAlreadyOpened_DoesNotResendNotification()
    {
        var wish = new Wish
        {
            RecipientName = "Kojo",
            RecipientRelationship = "Brother",
            RecipientTimezone = "Africa/Accra",
            Status = WishStatus.Opened,
            OpenedAtUtc = DateTime.UtcNow.AddHours(-1),
            DeliveredAtUtc = DateTime.UtcNow.AddHours(-1),
        };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);

        await _sut.MarkOpenedAsync(wish.Id);

        _emailSender.Verify(e => e.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RetryDeliveryAsync_WhenDeliveryFailed_UpdatesPhoneAndResetsAttemptBookkeeping()
    {
        var customerUserId = Guid.NewGuid();
        var wish = new Wish
        {
            CustomerUserId = customerUserId,
            RecipientName = "Kojo",
            RecipientRelationship = "Brother",
            RecipientTimezone = "Africa/Accra",
            Status = WishStatus.Sealed,
            DeliveryAttemptCount = 8,
            NextDeliveryAttemptAtUtc = DateTime.MaxValue,
        };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);

        var response = await _sut.RetryDeliveryAsync(customerUserId, wish.Id, new RetryDeliveryRequest("0244123456"));

        response.Code.Should().Be(200);
        wish.RecipientPhoneNumber.Should().Be("0244123456");
        wish.DeliveryAttemptCount.Should().Be(0);
        wish.NextDeliveryAttemptAtUtc.Should().NotBe(DateTime.MaxValue);
        response.Data!.DeliveryFailed.Should().BeFalse();
        _wishes.Verify(r => r.UpdateAsync(wish, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RetryDeliveryAsync_WhenNotInFailedState_ReturnsConflict()
    {
        var customerUserId = Guid.NewGuid();
        var wish = new Wish
        {
            CustomerUserId = customerUserId,
            RecipientName = "Kojo",
            RecipientRelationship = "Brother",
            RecipientTimezone = "Africa/Accra",
            Status = WishStatus.Sealed,
        };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);

        var response = await _sut.RetryDeliveryAsync(customerUserId, wish.Id, new RetryDeliveryRequest("0244123456"));

        response.Code.Should().Be(409);
        _wishes.Verify(r => r.UpdateAsync(It.IsAny<Wish>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    private static IFormFile MakeFormFile(string fileName, string contentType, byte[] content)
    {
        var stream = new MemoryStream(content);
        return new FormFile(stream, 0, content.Length, "file", fileName)
        {
            Headers = new Microsoft.AspNetCore.Http.HeaderDictionary(),
            ContentType = contentType,
        };
    }

    [Fact]
    public async Task UploadAttachmentAsync_WhenValidImage_UploadsToStorageAndReturnsCreated()
    {
        var customerUserId = Guid.NewGuid();
        var wish = new Wish { CustomerUserId = customerUserId, RecipientName = "Kojo", RecipientRelationship = "Brother", RecipientTimezone = "Africa/Accra" };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);
        _storageService.Setup(s => s.UploadAsync(It.Is<UploadFileRequest>(r => r.Folder == $"wishes/{wish.Id}"), It.IsAny<CancellationToken>()))
            .ReturnsAsync($"wishes/{wish.Id}/2026/08/03/abc123def456.png");

        var file = MakeFormFile("photo.png", "image/png", Encoding.UTF8.GetBytes("fake-image-bytes"));

        var response = await _sut.UploadAttachmentAsync(customerUserId, wish.Id, file);

        response.Code.Should().Be(201);
        response.Data!.Kind.Should().Be(AttachmentKind.Image);
        response.Data.Url.Should().Be($"http://localhost:9000/wishdem/wishes/{wish.Id}/2026/08/03/abc123def456.png");
        _storageService.Verify(s => s.UploadAsync(It.IsAny<UploadFileRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UploadAttachmentAsync_WhenFileTooLarge_ReturnsBadRequest()
    {
        var customerUserId = Guid.NewGuid();
        var wish = new Wish { CustomerUserId = customerUserId, RecipientName = "Kojo", RecipientRelationship = "Brother", RecipientTimezone = "Africa/Accra" };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);

        var oversized = new byte[26 * 1024 * 1024];
        var file = MakeFormFile("video.mp4", "video/mp4", oversized);

        var response = await _sut.UploadAttachmentAsync(customerUserId, wish.Id, file);

        response.Code.Should().Be(400);
    }

    [Fact]
    public async Task UploadAttachmentAsync_WhenUnsupportedContentType_ReturnsBadRequest()
    {
        var customerUserId = Guid.NewGuid();
        var wish = new Wish { CustomerUserId = customerUserId, RecipientName = "Kojo", RecipientRelationship = "Brother", RecipientTimezone = "Africa/Accra" };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);

        var file = MakeFormFile("doc.exe", "application/x-msdownload", Encoding.UTF8.GetBytes("data"));

        var response = await _sut.UploadAttachmentAsync(customerUserId, wish.Id, file);

        response.Code.Should().Be(400);
    }

    [Fact]
    public async Task UploadAttachmentAsync_WhenWishNotOwned_ReturnsNotFound()
    {
        var wish = new Wish { CustomerUserId = Guid.NewGuid(), RecipientName = "Kojo", RecipientRelationship = "Brother", RecipientTimezone = "Africa/Accra" };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);

        var file = MakeFormFile("photo.png", "image/png", Encoding.UTF8.GetBytes("fake"));

        var response = await _sut.UploadAttachmentAsync(Guid.NewGuid(), wish.Id, file);

        response.Code.Should().Be(404);
    }

    [Fact]
    public async Task UploadAttachmentAsync_WhenRepositoryThrows_ReturnsInternalError()
    {
        _wishes.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ThrowsAsync(new InvalidOperationException("db down"));

        var file = MakeFormFile("photo.png", "image/png", Encoding.UTF8.GetBytes("fake"));

        var response = await _sut.UploadAttachmentAsync(Guid.NewGuid(), Guid.NewGuid(), file);

        response.Code.Should().Be(500);
    }

    [Fact]
    public async Task UploadAttachmentAsync_WhenStorageProviderRejectsUpload_ReturnsInternalError()
    {
        var customerUserId = Guid.NewGuid();
        var wish = new Wish { CustomerUserId = customerUserId, RecipientName = "Kojo", RecipientRelationship = "Brother", RecipientTimezone = "Africa/Accra" };
        _wishes.Setup(r => r.GetByIdAsync(wish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(wish);
        _storageService.Setup(s => s.UploadAsync(It.IsAny<UploadFileRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new StorageException("bucket unreachable"));

        var file = MakeFormFile("photo.png", "image/png", Encoding.UTF8.GetBytes("fake"));

        var response = await _sut.UploadAttachmentAsync(customerUserId, wish.Id, file);

        response.Code.Should().Be(500);
    }
}
