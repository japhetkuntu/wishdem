namespace WishDem.Cache.Sdk.Services;

public interface ICacheService
{
    Task SetAsync(string key, object value, TimeSpan? expiration = null);

    Task<T?> GetAsync<T>(string key);

    /// <summary>Atomically increments the integer stored at <paramref name="key"/> (starting
    /// from 0 if it doesn't exist yet) and returns the new value — used for counters where
    /// concurrent callers must never lose an increment to a read-then-write race, e.g. "how
    /// many wishes has this customer created today". <paramref name="expiration"/> is only
    /// applied the first time the key is created, so repeated increments don't keep pushing
    /// the expiry back.</summary>
    Task<long> IncrementAsync(string key, TimeSpan? expiration = null);

    Task RemoveAsync(string key);

    Task<bool> ExistsAsync(string key);

    /// <summary>Adds <paramref name="member"/> to a Redis set at <paramref name="key"/> — used to
    /// index every refresh token issued to a user, so they can all be revoked together on
    /// password change without scanning the whole keyspace.</summary>
    Task AddToSetAsync(string key, string member, TimeSpan? expiration = null);

    Task<string[]> GetSetMembersAsync(string key);

    Task RemoveSetAsync(string key);
}
