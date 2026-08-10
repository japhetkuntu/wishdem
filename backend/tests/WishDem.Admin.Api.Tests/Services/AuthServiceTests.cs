using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using WishDem.Admin.Api.Configuration;
using WishDem.Admin.Api.Interfaces;
using WishDem.Admin.Api.Services;
using WishDem.Cache.Sdk.Services;
using WishDem.Messaging.Sdk.Abstractions;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;
using Xunit;

namespace WishDem.Admin.Api.Tests.Services;

public class AuthServiceTests
{
    private readonly Mock<IRepository<AdminUser>> _adminUsers = new();
    private readonly Mock<ITokenService> _tokenService = new();
    private readonly Mock<IPasswordHasher<AdminUser>> _passwordHasher = new();
    private readonly Mock<ICacheService> _cache = new();
    private readonly Mock<IEmailSender> _emailSender = new();
    private readonly Mock<IWebHostEnvironment> _environment = new();
    private readonly AuthService _sut;

    public AuthServiceTests()
    {
        _environment.Setup(e => e.EnvironmentName).Returns("Development");

        var options = Options.Create(new PasswordResetOptions());

        _sut = new AuthService(
            _adminUsers.Object,
            _tokenService.Object,
            _passwordHasher.Object,
            _cache.Object,
            _emailSender.Object,
            options,
            _environment.Object,
            Mock.Of<ILogger<AuthService>>());
    }

    private static AdminUser NewUser(string email = "admin@wishdem.com") => new()
    {
        Email = email,
        PasswordHash = "hashed",
        FullName = "Ama Admin",
        IsActive = true,
    };

    [Fact]
    public async Task LoginAsync_WhenCredentialsAreValid_ReturnsOk()
    {
        var user = NewUser();
        _adminUsers.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<AdminUser, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _passwordHasher.Setup(h => h.VerifyHashedPassword(user, user.PasswordHash, "password"))
            .Returns(PasswordVerificationResult.Success);
        _tokenService.Setup(t => t.IssueTokensAsync(user, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IssuedTokens("access", "refresh", DateTime.UtcNow.AddMinutes(15)));

        var response = await _sut.LoginAsync(user.Email, "password");

        response.Code.Should().Be(200);
        response.Data!.AccessToken.Should().Be("access");
    }

    [Fact]
    public async Task LoginAsync_WhenPasswordIsWrong_ReturnsUnauthorized()
    {
        var user = NewUser();
        _adminUsers.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<AdminUser, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _passwordHasher.Setup(h => h.VerifyHashedPassword(user, user.PasswordHash, "wrong"))
            .Returns(PasswordVerificationResult.Failed);

        var response = await _sut.LoginAsync(user.Email, "wrong");

        response.Code.Should().Be(401);
    }

    [Fact]
    public async Task LoginAsync_WhenUserDoesNotExist_ReturnsUnauthorized()
    {
        _adminUsers.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<AdminUser, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AdminUser?)null);

        var response = await _sut.LoginAsync("nobody@wishdem.com", "password");

        response.Code.Should().Be(401);
    }

    [Fact]
    public async Task LoginAsync_WhenRepositoryThrows_ReturnsInternalError()
    {
        _adminUsers.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<AdminUser, bool>>>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("db down"));

        var response = await _sut.LoginAsync("admin@wishdem.com", "password");

        response.Code.Should().Be(500);
    }

    [Fact]
    public async Task ChangePasswordAsync_WhenCurrentPasswordIsCorrect_BumpsTokenVersion()
    {
        var user = NewUser();
        var originalVersion = user.TokenVersion;
        _adminUsers.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _passwordHasher.Setup(h => h.VerifyHashedPassword(user, user.PasswordHash, "current"))
            .Returns(PasswordVerificationResult.Success);
        _passwordHasher.Setup(h => h.HashPassword(user, "newpassword123")).Returns("newhash");

        var response = await _sut.ChangePasswordAsync(user.Id, "current", "newpassword123");

        response.Code.Should().Be(200);
        response.Data.Should().BeTrue();
        user.TokenVersion.Should().Be(originalVersion + 1);
        user.PasswordHash.Should().Be("newhash");
    }

    [Fact]
    public async Task ChangePasswordAsync_WhenUserNotFound_ReturnsNotFound()
    {
        _adminUsers.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((AdminUser?)null);

        var response = await _sut.ChangePasswordAsync(Guid.NewGuid(), "current", "newpassword123");

        response.Code.Should().Be(404);
    }

    [Fact]
    public async Task ChangePasswordAsync_WhenCurrentPasswordIsWrong_ReturnsUnauthorized()
    {
        var user = NewUser();
        _adminUsers.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _passwordHasher.Setup(h => h.VerifyHashedPassword(user, user.PasswordHash, "wrong"))
            .Returns(PasswordVerificationResult.Failed);

        var response = await _sut.ChangePasswordAsync(user.Id, "wrong", "newpassword123");

        response.Code.Should().Be(401);
    }

    [Fact]
    public async Task ChangePasswordAsync_WhenRepositoryThrows_ReturnsInternalError()
    {
        _adminUsers.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("db down"));

        var response = await _sut.ChangePasswordAsync(Guid.NewGuid(), "current", "newpassword123");

        response.Code.Should().Be(500);
    }

    [Fact]
    public async Task ForgotPasswordAsync_WhenUserExists_ReturnsMaskedEmailWithDevCode()
    {
        var user = NewUser("admin@wishdem.com");
        _adminUsers.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<AdminUser, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _cache.Setup(c => c.ExistsAsync(It.IsAny<string>())).ReturnsAsync(false);

        var response = await _sut.ForgotPasswordAsync(user.Email);

        response.Code.Should().Be(200);
        response.Data!.MaskedEmail.Should().StartWith("a").And.EndWith("@wishdem.com");
        response.Data.DevCode.Should().NotBeNull();
        _emailSender.Verify(e => e.SendAsync(user.Email, It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ForgotPasswordAsync_WhenUserDoesNotExist_ReturnsMaskedResponseWithoutRevealingAbsence()
    {
        _adminUsers.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<AdminUser, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AdminUser?)null);
        _cache.Setup(c => c.ExistsAsync(It.IsAny<string>())).ReturnsAsync(false);

        var response = await _sut.ForgotPasswordAsync("nobody@wishdem.com");

        response.Code.Should().Be(200);
        response.Data!.DevCode.Should().BeNull();
        _emailSender.Verify(e => e.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ForgotPasswordAsync_InProduction_DoesNotReturnDevCode()
    {
        _environment.Setup(e => e.EnvironmentName).Returns("Production");
        var user = NewUser();
        _adminUsers.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<AdminUser, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _cache.Setup(c => c.ExistsAsync(It.IsAny<string>())).ReturnsAsync(false);

        var response = await _sut.ForgotPasswordAsync(user.Email);

        response.Code.Should().Be(200);
        response.Data!.DevCode.Should().BeNull();
    }

    [Fact]
    public async Task ForgotPasswordAsync_WhenCacheThrows_ReturnsInternalError()
    {
        _adminUsers.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<AdminUser, bool>>>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("cache down"));

        var response = await _sut.ForgotPasswordAsync("admin@wishdem.com");

        response.Code.Should().Be(500);
    }

    [Fact]
    public async Task ResetPasswordAsync_WhenCodeIsCorrect_BumpsTokenVersionAndClearsCache()
    {
        var user = NewUser();
        var originalVersion = user.TokenVersion;
        _adminUsers.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<AdminUser, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _cache.Setup(c => c.GetAsync<string>(It.IsAny<string>())).ReturnsAsync("123456");
        _passwordHasher.Setup(h => h.HashPassword(user, "newpassword123")).Returns("newhash");

        var response = await _sut.ResetPasswordAsync(user.Email, "123456", "newpassword123");

        response.Code.Should().Be(200);
        response.Data.Should().BeTrue();
        user.TokenVersion.Should().Be(originalVersion + 1);
        user.PasswordHash.Should().Be("newhash");
        _cache.Verify(c => c.RemoveAsync(It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task ResetPasswordAsync_WhenCodeIsWrong_ReturnsUnauthorized()
    {
        var user = NewUser();
        _adminUsers.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<AdminUser, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _cache.Setup(c => c.GetAsync<string>(It.IsAny<string>())).ReturnsAsync("999999");

        var response = await _sut.ResetPasswordAsync(user.Email, "123456", "newpassword123");

        response.Code.Should().Be(401);
        _adminUsers.Verify(r => r.UpdateAsync(It.IsAny<AdminUser>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ResetPasswordAsync_WhenNoCodeStored_ReturnsUnauthorized()
    {
        var user = NewUser();
        _adminUsers.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<AdminUser, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _cache.Setup(c => c.GetAsync<string>(It.IsAny<string>())).ReturnsAsync((string?)null);

        var response = await _sut.ResetPasswordAsync(user.Email, "123456", "newpassword123");

        response.Code.Should().Be(401);
    }

    [Fact]
    public async Task ResetPasswordAsync_WhenUserDoesNotExist_ReturnsUnauthorizedWithoutLeakingExistence()
    {
        _adminUsers.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<AdminUser, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AdminUser?)null);
        _cache.Setup(c => c.GetAsync<string>(It.IsAny<string>())).ReturnsAsync("123456");

        var response = await _sut.ResetPasswordAsync("nobody@wishdem.com", "123456", "newpassword123");

        response.Code.Should().Be(401);
    }

    [Fact]
    public async Task ResetPasswordAsync_WhenCacheThrows_ReturnsInternalError()
    {
        _cache.Setup(c => c.GetAsync<string>(It.IsAny<string>())).ThrowsAsync(new InvalidOperationException("cache down"));

        var response = await _sut.ResetPasswordAsync("admin@wishdem.com", "123456", "newpassword123");

        response.Code.Should().Be(500);
    }

    [Fact]
    public async Task LogoutAsync_RevokesToken_ReturnsOk()
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
            .ThrowsAsync(new InvalidOperationException("cache down"));

        var response = await _sut.LogoutAsync("refresh-token");

        response.Code.Should().Be(500);
    }

    [Fact]
    public async Task RefreshAsync_WhenTokenIsValid_ReturnsOk()
    {
        var user = NewUser();
        _tokenService.Setup(t => t.PeekRefreshTokenAsync("refresh-token", It.IsAny<CancellationToken>()))
            .ReturnsAsync((user.Id, user.TokenVersion));
        _adminUsers.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        _tokenService.Setup(t => t.IssueTokensAsync(user, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IssuedTokens("access2", "refresh2", DateTime.UtcNow.AddMinutes(15)));

        var response = await _sut.RefreshAsync("refresh-token");

        response.Code.Should().Be(200);
        response.Data!.AccessToken.Should().Be("access2");
    }

    [Fact]
    public async Task RefreshAsync_WhenTokenVersionMismatched_ReturnsUnauthorized()
    {
        var user = NewUser();
        _tokenService.Setup(t => t.PeekRefreshTokenAsync("refresh-token", It.IsAny<CancellationToken>()))
            .ReturnsAsync((user.Id, user.TokenVersion + 1));
        _adminUsers.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);

        var response = await _sut.RefreshAsync("refresh-token");

        response.Code.Should().Be(401);
    }

    [Fact]
    public async Task RefreshAsync_WhenTokenMissing_ReturnsUnauthorized()
    {
        _tokenService.Setup(t => t.PeekRefreshTokenAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(((Guid, int)?)null);

        var response = await _sut.RefreshAsync("missing-token");

        response.Code.Should().Be(401);
    }

    [Fact]
    public async Task RefreshAsync_WhenTokenServiceThrows_ReturnsInternalError()
    {
        _tokenService.Setup(t => t.PeekRefreshTokenAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("cache down"));

        var response = await _sut.RefreshAsync("refresh-token");

        response.Code.Should().Be(500);
    }
}
