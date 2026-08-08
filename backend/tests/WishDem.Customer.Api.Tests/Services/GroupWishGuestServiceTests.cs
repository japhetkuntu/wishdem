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

public class GroupWishGuestServiceTests
{
    private readonly Mock<IRepository<GroupWishInvitation>> _invitations = new();
    private readonly Mock<IRepository<GroupWish>> _groupWishes = new();
    private readonly Mock<IRepository<GroupWishMemory>> _memories = new();
    private readonly Mock<IRepository<CustomerUser>> _customerUsers = new();
    private readonly GroupWishGuestService _sut;

    public GroupWishGuestServiceTests()
    {
        _sut = new GroupWishGuestService(_invitations.Object, _groupWishes.Object, _memories.Object, _customerUsers.Object, Mock.Of<ILogger<GroupWishGuestService>>());
    }

    private static SaveMemoryRequest ValidMemoryRequest() => new(
        Format: MemoryFormat.Notes,
        Title: "Happy birthday",
        Body: "Have a great one!",
        WhenWhere: null,
        AttachmentUrl: null,
        AttachmentDurationSeconds: null);

    private (GroupWishInvitation Invitation, GroupWish GroupWish) SetUpInvitation(
        GroupWishInvitationStatus invitationStatus = GroupWishInvitationStatus.Invited,
        GroupWishStatus groupWishStatus = GroupWishStatus.Collecting,
        string token = "tok123")
    {
        var groupWish = new GroupWish { Title = "T", RecipientName = "R", Status = groupWishStatus };
        var invitation = new GroupWishInvitation
        {
            GroupWishId = groupWish.Id,
            InviteToken = token,
            GuestName = "Ama",
            Status = invitationStatus,
        };
        _invitations.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<GroupWishInvitation, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(invitation);
        _groupWishes.Setup(r => r.GetByIdAsync(groupWish.Id, It.IsAny<CancellationToken>())).ReturnsAsync(groupWish);
        return (invitation, groupWish);
    }

    [Fact]
    public async Task GetInvitationContextAsync_WhenTokenValid_ReturnsOk()
    {
        var (invitation, _) = SetUpInvitation();

        var response = await _sut.GetInvitationContextAsync(invitation.InviteToken);

        response.Code.Should().Be(200);
        response.Data!.InviteToken.Should().Be(invitation.InviteToken);
    }

    [Fact]
    public async Task GetInvitationContextAsync_WhenTokenNotFound_ReturnsNotFound()
    {
        _invitations.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<GroupWishInvitation, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((GroupWishInvitation?)null);

        var response = await _sut.GetInvitationContextAsync("missing-token");

        response.Code.Should().Be(404);
    }

    [Fact]
    public async Task GetInvitationContextAsync_WhenRepositoryThrows_ReturnsInternalError()
    {
        _invitations.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<GroupWishInvitation, bool>>>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("db down"));

        var response = await _sut.GetInvitationContextAsync("tok");

        response.Code.Should().Be(500);
    }

    [Fact]
    public async Task RespondAsync_WhenCollecting_UpdatesAndReturnsOk()
    {
        var (invitation, _) = SetUpInvitation();

        var response = await _sut.RespondAsync(invitation.InviteToken, new RespondToInvitationRequest(GroupWishInvitationStatus.Joined));

        response.Code.Should().Be(200);
        response.Data!.Status.Should().Be(GroupWishInvitationStatus.Joined);
    }

    [Fact]
    public async Task RespondAsync_WhenGroupWishNotCollecting_ReturnsConflict()
    {
        var (invitation, _) = SetUpInvitation(groupWishStatus: GroupWishStatus.Sealed);

        var response = await _sut.RespondAsync(invitation.InviteToken, new RespondToInvitationRequest(GroupWishInvitationStatus.Joined));

        response.Code.Should().Be(409);
    }

    [Fact]
    public async Task SubmitMemoryAsync_WhenJoined_ReturnsCreated()
    {
        var (invitation, _) = SetUpInvitation(GroupWishInvitationStatus.Joined);

        var response = await _sut.SubmitMemoryAsync(invitation.InviteToken, ValidMemoryRequest());

        response.Code.Should().Be(201);
        response.Data!.Body.Should().Be("Have a great one!");
    }

    [Fact]
    public async Task SubmitMemoryAsync_WhenDeclined_ReturnsConflict()
    {
        var (invitation, _) = SetUpInvitation(GroupWishInvitationStatus.Declined);

        var response = await _sut.SubmitMemoryAsync(invitation.InviteToken, ValidMemoryRequest());

        response.Code.Should().Be(409);
    }

    [Fact]
    public async Task SubmitMemoryAsync_WhenRepositoryThrows_ReturnsInternalError()
    {
        _invitations.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<GroupWishInvitation, bool>>>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("db down"));

        var response = await _sut.SubmitMemoryAsync("tok", ValidMemoryRequest());

        response.Code.Should().Be(500);
    }

    [Fact]
    public async Task SealMemoryAsync_WhenNotSealed_SealsAndReturnsOk()
    {
        var (invitation, _) = SetUpInvitation();
        var memory = new GroupWishMemory { GroupWishId = invitation.GroupWishId, InvitationId = invitation.Id, Body = "hi" };
        _memories.Setup(r => r.GetByIdAsync(memory.Id, It.IsAny<CancellationToken>())).ReturnsAsync(memory);

        var response = await _sut.SealMemoryAsync(invitation.InviteToken, memory.Id);

        response.Code.Should().Be(200);
        response.Data!.IsSealed.Should().BeTrue();
    }

    [Fact]
    public async Task SealMemoryAsync_WhenAlreadySealed_ReturnsConflict()
    {
        var (invitation, _) = SetUpInvitation();
        var memory = new GroupWishMemory { GroupWishId = invitation.GroupWishId, InvitationId = invitation.Id, Body = "hi", IsSealed = true };
        _memories.Setup(r => r.GetByIdAsync(memory.Id, It.IsAny<CancellationToken>())).ReturnsAsync(memory);

        var response = await _sut.SealMemoryAsync(invitation.InviteToken, memory.Id);

        response.Code.Should().Be(409);
    }

    [Fact]
    public async Task SealMemoryAsync_WhenMemoryBelongsToDifferentInvitation_ReturnsNotFound()
    {
        var (invitation, _) = SetUpInvitation();
        var memory = new GroupWishMemory { GroupWishId = invitation.GroupWishId, InvitationId = Guid.NewGuid(), Body = "hi" };
        _memories.Setup(r => r.GetByIdAsync(memory.Id, It.IsAny<CancellationToken>())).ReturnsAsync(memory);

        var response = await _sut.SealMemoryAsync(invitation.InviteToken, memory.Id);

        response.Code.Should().Be(404);
    }
}
