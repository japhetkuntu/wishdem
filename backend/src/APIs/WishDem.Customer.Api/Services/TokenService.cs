using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using WishDem.Cache.Sdk.Services;
using WishDem.Customer.Api.Configuration;
using WishDem.Customer.Api.Interfaces;
using WishDem.Postgres.Sdk.Entities;

namespace WishDem.Customer.Api.Services;

public class TokenService(IOptions<JwtOptions> jwtOptions, ICacheService cache) : ITokenService
{
    private readonly JwtOptions _jwt = jwtOptions.Value;

    public string GenerateAccessToken(CustomerUser user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
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

    public async Task<IssuedTokens> IssueTokensAsync(CustomerUser user, CancellationToken ct = default)
    {
        var accessToken = GenerateAccessToken(user);
        var refreshToken = GenerateOpaqueToken();
        var ttl = TimeSpan.FromDays(_jwt.RefreshTokenDays);

        await cache.SetAsync(RefreshKey(refreshToken), user.Id, ttl);
        await cache.AddToSetAsync(RefreshSetKey(user.Id), refreshToken, ttl);

        return new IssuedTokens(accessToken, refreshToken, DateTime.UtcNow.AddMinutes(_jwt.AccessTokenMinutes));
    }

    public Task<Guid?> ValidateRefreshTokenAsync(string refreshToken, CancellationToken ct = default) =>
        cache.GetAsync<Guid?>(RefreshKey(refreshToken));

    public Task RevokeRefreshTokenAsync(string refreshToken, CancellationToken ct = default) =>
        // The "byuser" set (see RefreshSetKey) is only an index for bulk revocation on
        // password change — a stale member left behind here is harmless, since validity is
        // decided by whether the token's own primary key (removed below) still exists.
        cache.RemoveAsync(RefreshKey(refreshToken));

    private static string GenerateOpaqueToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
        .Replace('+', '-').Replace('/', '_').TrimEnd('=');

    private static string RefreshKey(string token) => $"customer:refresh:{token}";

    private static string RefreshSetKey(Guid userId) => $"customer:refresh:byuser:{userId}";
}
