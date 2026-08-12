using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using WishDem.Cache.Sdk.Services;
using WishDem.Customer.Api.Configuration;
using WishDem.Customer.Api.Interfaces;
using WishDem.Customer.Api.Services;
using WishDem.Messaging.Sdk.Abstractions;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;
using Xunit;

namespace WishDem.Customer.Api.Tests.Services;

public class AuthServiceTests
{
    private readonly Mock<IRepository<CustomerUser>> _customerUsers = new();
    private readonly Mock<ITokenService> _tokenService = new();
    private readonly Mock<ICacheService> _cache = new();
    private readonly Mock<IEmailSender> _emailSender = new();
    private readonly Mock<IWebHostEnvironment> _environment = new();
    private readonly AuthService _sut;

    public AuthServiceTests()
    {
        _environment.Setup(e => e.EnvironmentName).Returns("Development");

        _sut = new AuthService(
            _customerUsers.Object,
            _tokenService.Object,
            _cache.Object,
            _emailSender.Object,
            Options.Create(new OtpOptions()),
            Options.Create(new GoogleAuthOptions { ClientId = "test-client-id" }),
            _environment.Object,
            Mock.Of<ILogger<AuthService>>());
    }

    [Fact]
    public async Task RequestOtpAsync_WhenNoCooldown_SendsCodeAndReturnsOk()
    {
        _cache.Setup(c => c.ExistsAsync(It.IsAny<string>())).ReturnsAsync(false);
        _customerUsers.Setup(r => r.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<CustomerUser, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var response = await _sut.RequestOtpAsync("Test@Example.com");

        response.Code.Should().Be(200);
        response.Data!.IsNewCustomer.Should().BeTrue();
        _emailSender.Verify(e => e.SendAsync("test@example.com", It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RequestOtpAsync_WhenOnCooldown_ReturnsConflict()
    {
        _cache.Setup(c => c.ExistsAsync(It.IsAny<string>())).ReturnsAsync(true);

        var response = await _sut.RequestOtpAsync("test@example.com");

        response.Code.Should().Be(409);
    }

    [Fact]
    public async Task RequestOtpAsync_WhenCacheThrows_ReturnsInternalError()
    {
        _cache.Setup(c => c.ExistsAsync(It.IsAny<string>())).ThrowsAsync(new InvalidOperationException("cache down"));

        var response = await _sut.RequestOtpAsync("test@example.com");

        response.Code.Should().Be(500);
    }

    [Fact]
    public async Task VerifyOtpAsync_WhenCodeMatches_CreatesUserAndReturnsOk()
    {
        _cache.Setup(c => c.GetAsync<string>(It.IsAny<string>())).ReturnsAsync("123456");
        _customerUsers.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<CustomerUser, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((CustomerUser?)null);
        _tokenService.Setup(t => t.IssueTokensAsync(It.IsAny<CustomerUser>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IssuedTokens("access", "refresh", DateTime.UtcNow.AddMinutes(15)));

        var response = await _sut.VerifyOtpAsync("new@example.com", "123456", "New User");

        response.Code.Should().Be(200);
        response.Data!.AccessToken.Should().Be("access");
        _customerUsers.Verify(r => r.AddAsync(It.IsAny<CustomerUser>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task VerifyOtpAsync_WhenCodeDoesNotMatch_ReturnsUnauthorized()
    {
        _cache.Setup(c => c.GetAsync<string>(It.IsAny<string>())).ReturnsAsync("111111");

        var response = await _sut.VerifyOtpAsync("test@example.com", "222222", null);

        response.Code.Should().Be(401);
    }

    [Fact]
    public async Task VerifyOtpAsync_AfterMaxFailedAttempts_InvalidatesCodeEvenIfLaterCorrect()
    {
        _cache.Setup(c => c.GetAsync<string>(It.IsAny<string>())).ReturnsAsync("123456");
        _cache.Setup(c => c.IncrementAsync(It.IsAny<string>(), It.IsAny<TimeSpan?>())).ReturnsAsync(5);

        var response = await _sut.VerifyOtpAsync("test@example.com", "wrong-code", null);

        response.Code.Should().Be(401);
        _cache.Verify(c => c.RemoveAsync(It.Is<string>(k => k.StartsWith("customer:otp:") && !k.Contains("attempts"))), Times.Once);
    }

    [Fact]
    public async Task VerifyOtpAsync_WhenRepositoryThrows_ReturnsInternalError()
    {
        _cache.Setup(c => c.GetAsync<string>(It.IsAny<string>())).ThrowsAsync(new InvalidOperationException("db down"));

        var response = await _sut.VerifyOtpAsync("test@example.com", "123456", null);

        response.Code.Should().Be(500);
    }

    [Fact]
    public async Task RefreshAsync_WhenTokenInvalid_ReturnsUnauthorized()
    {
        _tokenService.Setup(t => t.ValidateRefreshTokenAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Guid?)null);

        var response = await _sut.RefreshAsync("bad-token");

        response.Code.Should().Be(401);
    }

    [Fact]
    public async Task RefreshAsync_WhenUserMissing_ReturnsUnauthorized()
    {
        var userId = Guid.NewGuid();
        _tokenService.Setup(t => t.ValidateRefreshTokenAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(userId);
        _customerUsers.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>())).ReturnsAsync((CustomerUser?)null);

        var response = await _sut.RefreshAsync("some-token");

        response.Code.Should().Be(401);
    }

    [Fact]
    public async Task LogoutAsync_RevokesTokenAndReturnsOk()
    {
        var response = await _sut.LogoutAsync("refresh-token");

        response.Code.Should().Be(200);
        response.Data.Should().BeTrue();
        _tokenService.Verify(t => t.RevokeRefreshTokenAsync("refresh-token", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task LogoutAsync_WhenTokenServiceThrows_ReturnsInternalError()
    {
        _tokenService.Setup(t => t.RevokeRefreshTokenAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("boom"));

        var response = await _sut.LogoutAsync("refresh-token");

        response.Code.Should().Be(500);
    }
}
