using WishDem.Postgres.Sdk.Entities;

namespace WishDem.Customer.Api.Interfaces;

public record IssuedTokens(string AccessToken, string RefreshToken, DateTime AccessTokenExpiresAtUtc);

public interface ITokenService
{
    string GenerateAccessToken(CustomerUser user);

    Task<IssuedTokens> IssueTokensAsync(CustomerUser user, CancellationToken ct = default);

    Task<Guid?> ValidateRefreshTokenAsync(string refreshToken, CancellationToken ct = default);

    Task RevokeRefreshTokenAsync(string refreshToken, CancellationToken ct = default);
}
