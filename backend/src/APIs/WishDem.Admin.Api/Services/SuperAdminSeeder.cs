using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using WishDem.Admin.Api.Configuration;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Admin.Api.Services;

/// <summary>Ensures the config-defined super admin account exists and is reachable with the
/// configured password on every startup, since this API has no public registration endpoint —
/// the very first admin has to come from somewhere, and it must stay recoverable from config
/// alone rather than becoming a one-time seed that can drift out of sync (e.g. after a manual
/// password reset in a dev database) with no way back in.</summary>
public class SuperAdminSeeder(
    IServiceScopeFactory scopeFactory,
    IOptions<SuperAdminOptions> options,
    ILogger<SuperAdminSeeder> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var adminUsers = scope.ServiceProvider.GetRequiredService<IRepository<AdminUser>>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<AdminUser>>();

        var superAdmin = options.Value;
        var normalizedEmail = superAdmin.Email.Trim().ToLowerInvariant();

        var existing = await adminUsers.FindAsync(u => u.Email == normalizedEmail, ct);
        if (existing is not null)
        {
            existing.PasswordHash = passwordHasher.HashPassword(existing, superAdmin.Password);
            await adminUsers.UpdateAsync(existing, ct);
            logger.LogInformation("Reconciled config super admin account for {Email}", normalizedEmail);
            return;
        }

        var user = new AdminUser
        {
            Email = normalizedEmail,
            FullName = superAdmin.FullName,
            Role = "SuperAdmin",
            PasswordHash = string.Empty,
        };
        user.PasswordHash = passwordHasher.HashPassword(user, superAdmin.Password);

        await adminUsers.AddAsync(user, ct);
        logger.LogInformation("Seeded initial admin account for {Email}", normalizedEmail);
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
