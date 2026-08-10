using System.Text.Json;
using StackExchange.Redis;

namespace WishDem.Cache.Sdk.Services;

public class RedisCacheService(IConnectionMultiplexer connectionMultiplexer) : ICacheService
{
    private IDatabase Database => connectionMultiplexer.GetDatabase();

    public Task SetAsync(string key, object value, TimeSpan? expiration = null) =>
        Database.StringSetAsync(key, JsonSerializer.Serialize(value), expiration);

    public async Task<T?> GetAsync<T>(string key)
    {
        var value = await Database.StringGetAsync(key);
        return value.HasValue ? JsonSerializer.Deserialize<T>(value!) : default;
    }

    public async Task<long> IncrementAsync(string key, TimeSpan? expiration = null)
    {
        var newValue = await Database.StringIncrementAsync(key);
        // Only the caller who created the key (INCR on a missing key starts at 0, so the
        // first increment lands on 1) sets the expiry — later callers just bump the value.
        if (newValue == 1 && expiration is not null)
            await Database.KeyExpireAsync(key, expiration);

        return newValue;
    }

    public Task RemoveAsync(string key) => Database.KeyDeleteAsync(key);

    public Task<bool> ExistsAsync(string key) => Database.KeyExistsAsync(key);

    public async Task AddToSetAsync(string key, string member, TimeSpan? expiration = null)
    {
        await Database.SetAddAsync(key, member);
        if (expiration is not null) await Database.KeyExpireAsync(key, expiration);
    }

    public async Task<string[]> GetSetMembersAsync(string key)
    {
        var members = await Database.SetMembersAsync(key);
        return members.Select(m => m.ToString()).ToArray();
    }

    public Task RemoveSetAsync(string key) => Database.KeyDeleteAsync(key);
}
