using WishDem.Postgres.Sdk.Entities;

namespace WishDem.Admin.Api.Interfaces;

public record IssuedTokens(string AccessToken, string RefreshToken, DateTime AccessTokenExpiresAtUtc);

public interface ITokenService
{
    string GenerateAccessToken(AdminUser user);

    Task<IssuedTokens> IssueTokensAsync(AdminUser user, CancellationToken ct = default);

    /// <summary>Returns the user id and the token-version the refresh token was issued under,
    /// or null if the token doesn't exist/has expired. Callers must separately compare the
    /// returned version against the user's current TokenVersion to detect bulk revocation
    /// (e.g. from a password change) since the caller — not this cache lookup — owns the user record.</summary>
    Task<(Guid UserId, int TokenVersion)?> PeekRefreshTokenAsync(string refreshToken, CancellationToken ct = default);

    Task RevokeRefreshTokenAsync(string refreshToken, CancellationToken ct = default);
}
