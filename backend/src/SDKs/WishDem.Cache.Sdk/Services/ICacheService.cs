namespace WishDem.Cache.Sdk.Services;

public interface ICacheService
{
    Task SetAsync(string key, object value, TimeSpan? expiration = null);

    Task<T?> GetAsync<T>(string key);

    Task RemoveAsync(string key);

    Task<bool> ExistsAsync(string key);

    /// <summary>Adds <paramref name="member"/> to a Redis set at <paramref name="key"/> — used to
    /// index every refresh token issued to a user, so they can all be revoked together on
    /// password change without scanning the whole keyspace.</summary>
    Task AddToSetAsync(string key, string member, TimeSpan? expiration = null);

    Task<string[]> GetSetMembersAsync(string key);

    Task RemoveSetAsync(string key);
}
