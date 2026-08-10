using System.Linq.Expressions;
using FluentAssertions;
using Moq;
using WishDem.Admin.Api.Models.Requests;
using WishDem.Admin.Api.Interfaces;
using WishDem.Admin.Api.Services;
using WishDem.Common.Sdk.Enums;
using WishDem.Common.Sdk.Responses;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;
using Xunit;

namespace WishDem.Admin.Api.Tests.Services;

public class ModerationServiceTests
{
    private readonly Mock<IRepository<ModerationCase>> _cases = new();
    private readonly Mock<IRepository<Wish>> _wishes = new();
    private readonly Mock<IRepository<AdminUser>> _adminUsers = new();
    private readonly ModerationService _sut;

    public ModerationServiceTests()
    {
        _sut = new ModerationService(_cases.Object, _wishes.Object, _adminUsers.Object, Mock.Of<IAuditLogService>(), Mock.Of<Microsoft.Extensions.Logging.ILogger<ModerationService>>());
    }

    private static ModerationCase NewCase(Guid wishId) => new()
    {
        WishId = wishId,
        Title = "Inappropriate message",
    };

    [Fact]
    public async Task GetAllAsync_ReturnsPagedResult()
    {
        var moderationCase = NewCase(Guid.NewGuid());
        _cases.Setup(r => r.GetPagedAsync(
                0, 20,
                It.IsAny<Expression<Func<ModerationCase, bool>>>(),
                It.IsAny<Func<IQueryable<ModerationCase>, IOrderedQueryable<ModerationCase>>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PagedResult<ModerationCase> { Items = [moderationCase], PageIndex = 0, PageSize = 20, TotalCount = 1 });
        _adminUsers.Setup(r => r.FindManyAsync(It.IsAny<Expression<Func<AdminUser, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        var response = await _sut.GetAllAsync(0, 20, null);

        response.Code.Should().Be(200);
        response.Data!.TotalCount.Should().Be(1);
    }

    [Fact]
    public async Task GetByIdAsync_WhenCaseDoesNotExist_ReturnsNotFound()
    {
        _cases.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((ModerationCase?)null);

        var response = await _sut.GetByIdAsync(Guid.NewGuid());

        response.Code.Should().Be(404);
    }

    [Fact]
    public async Task CreateAsync_WhenWishExists_ReturnsCreated()
    {
        var wishId = Guid.NewGuid();
        _wishes.Setup(r => r.GetByIdAsync(wishId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Wish { CustomerUserId = Guid.NewGuid(), RecipientName = "Kojo", RecipientRelationship = "Brother", RecipientTimezone = "Africa/Accra" });
        _cases.Setup(r => r.AddAsync(It.IsAny<ModerationCase>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var request = new CreateModerationCaseRequest(wishId, "Flagged", null, null, null, ModerationSeverity.Medium);
        var response = await _sut.CreateAsync(request);

        response.Code.Should().Be(201);
        response.Data!.WishId.Should().Be(wishId);
    }

    [Fact]
    public async Task CreateAsync_WhenWishDoesNotExist_ReturnsNotFound()
    {
        _wishes.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((Wish?)null);

        var request = new CreateModerationCaseRequest(Guid.NewGuid(), "Flagged", null, null, null, ModerationSeverity.Medium);
        var response = await _sut.CreateAsync(request);

        response.Code.Should().Be(404);
    }

    [Fact]
    public async Task DecideAsync_WhenUnderReview_ResolvesCase()
    {
        var wishId = Guid.NewGuid();
        var moderationCase = NewCase(wishId);
        var reviewerId = Guid.NewGuid();
        _cases.Setup(r => r.GetByIdAsync(moderationCase.Id, It.IsAny<CancellationToken>())).ReturnsAsync(moderationCase);
        _cases.Setup(r => r.UpdateAsync(It.IsAny<ModerationCase>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _adminUsers.Setup(r => r.GetByIdAsync(reviewerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AdminUser { Email = "ama@wishdem.com", PasswordHash = "hash", FullName = "Ama Admin" });

        var response = await _sut.DecideAsync(reviewerId, moderationCase.Id, new DecideModerationCaseRequest(ModerationDecision.Approved, "Looks fine"));

        response.Code.Should().Be(200);
        response.Data!.Status.Should().Be(ModerationStatus.Resolved);
        response.Data.Decision.Should().Be(ModerationDecision.Approved);
    }

    [Fact]
    public async Task DecideAsync_WhenDecisionIsRemoved_RemovesWish()
    {
        var wishId = Guid.NewGuid();
        var moderationCase = NewCase(wishId);
        var reviewerId = Guid.NewGuid();
        var wish = new Wish { Id = wishId, CustomerUserId = Guid.NewGuid(), RecipientName = "Kojo", RecipientRelationship = "Brother", RecipientTimezone = "Africa/Accra" };

        _cases.Setup(r => r.GetByIdAsync(moderationCase.Id, It.IsAny<CancellationToken>())).ReturnsAsync(moderationCase);
        _cases.Setup(r => r.UpdateAsync(It.IsAny<ModerationCase>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _wishes.Setup(r => r.GetByIdAsync(wishId, It.IsAny<CancellationToken>())).ReturnsAsync(wish);
        _wishes.Setup(r => r.RemoveAsync(wish, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _adminUsers.Setup(r => r.GetByIdAsync(reviewerId, It.IsAny<CancellationToken>())).ReturnsAsync((AdminUser?)null);

        var response = await _sut.DecideAsync(reviewerId, moderationCase.Id, new DecideModerationCaseRequest(ModerationDecision.Removed, "Violates policy"));

        response.Code.Should().Be(200);
        _wishes.Verify(r => r.RemoveAsync(wish, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DecideAsync_WhenAlreadyResolved_ReturnsConflict()
    {
        var moderationCase = NewCase(Guid.NewGuid());
        moderationCase.Status = ModerationStatus.Resolved;
        _cases.Setup(r => r.GetByIdAsync(moderationCase.Id, It.IsAny<CancellationToken>())).ReturnsAsync(moderationCase);

        var response = await _sut.DecideAsync(Guid.NewGuid(), moderationCase.Id, new DecideModerationCaseRequest(ModerationDecision.Approved, "reason"));

        response.Code.Should().Be(409);
    }

    [Fact]
    public async Task DecideAsync_WhenCaseDoesNotExist_ReturnsNotFound()
    {
        _cases.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((ModerationCase?)null);

        var response = await _sut.DecideAsync(Guid.NewGuid(), Guid.NewGuid(), new DecideModerationCaseRequest(ModerationDecision.Approved, "reason"));

        response.Code.Should().Be(404);
    }
}
