using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using WishDem.Admin.Api.Configuration;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Admin.Api.Services;

/// <summary>Ensures exactly one admin account exists on startup, since this API has no
/// public registration endpoint — the very first admin has to come from somewhere.</summary>
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

        if (await adminUsers.ExistsAsync(u => u.Email == normalizedEmail, ct)) return;

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
