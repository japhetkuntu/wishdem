using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using WishDem.Admin.Api.Configuration;
using WishDem.Admin.Api.Interfaces;
using WishDem.Cache.Sdk.Services;
using WishDem.Common.Sdk.Constants;
using WishDem.Postgres.Sdk.Entities;

namespace WishDem.Admin.Api.Services;

public class TokenService(IOptions<JwtOptions> jwtOptions, ICacheService cache) : ITokenService
{
    private readonly JwtOptions _jwt = jwtOptions.Value;

    public string GenerateAccessToken(AdminUser user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(AuthConstants.TokenVersionClaim, user.TokenVersion.ToString()),
        };

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.SigningKey));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwt.AccessTokenMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<IssuedTokens> IssueTokensAsync(AdminUser user, CancellationToken ct = default)
    {
        var accessToken = GenerateAccessToken(user);
        var refreshToken = GenerateOpaqueToken();
        var ttl = TimeSpan.FromDays(_jwt.RefreshTokenDays);

        await cache.SetAsync(RefreshKey(refreshToken), new StoredRefreshToken(user.Id, user.TokenVersion), ttl);
        await cache.AddToSetAsync(RefreshSetKey(user.Id), refreshToken, ttl);

        return new IssuedTokens(accessToken, refreshToken, DateTime.UtcNow.AddMinutes(_jwt.AccessTokenMinutes));
    }

    public async Task<(Guid UserId, int TokenVersion)?> PeekRefreshTokenAsync(string refreshToken, CancellationToken ct = default)
    {
        var stored = await cache.GetAsync<StoredRefreshToken>(RefreshKey(refreshToken));
        return stored is null ? null : (stored.UserId, stored.TokenVersion);
    }

    public Task RevokeRefreshTokenAsync(string refreshToken, CancellationToken ct = default) =>
        // The "byuser" set (see RefreshSetKey) is only an index for bulk revocation on
        // password change — a stale member left behind here is harmless, since validity is
        // decided by whether the token's own primary key (removed below) still exists.
        cache.RemoveAsync(RefreshKey(refreshToken));

    private static string GenerateOpaqueToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
        .Replace('+', '-').Replace('/', '_').TrimEnd('=');

    private static string RefreshKey(string token) => $"admin:refresh:{token}";

    private static string RefreshSetKey(Guid userId) => $"admin:refresh:byuser:{userId}";

    private record StoredRefreshToken(Guid UserId, int TokenVersion);
}
