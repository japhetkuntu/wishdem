using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Persistence;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Postgres.Sdk.Extensions;

public static class PostgresServiceExtensions
{
    public static IServiceCollection AddPostgresSdk(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Postgres")
            ?? throw new InvalidOperationException("Missing connection string 'Postgres'.");

        services.AddDbContext<WishDemDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql =>
                npgsql.MigrationsHistoryTable("__ef_migrations_history", "core")));

        services.AddScoped<IRepository<CustomerUser>, EfRepository<CustomerUser>>();
        services.AddScoped<IRepository<AdminUser>, EfRepository<AdminUser>>();
        services.AddScoped<IRepository<Wish>, EfRepository<Wish>>();
        services.AddScoped<IRepository<CirclePerson>, EfRepository<CirclePerson>>();
        services.AddScoped<IRepository<Payment>, EfRepository<Payment>>();
        services.AddScoped<IRepository<ModerationCase>, EfRepository<ModerationCase>>();
        services.AddScoped<IRepository<GroupWish>, EfRepository<GroupWish>>();
        services.AddScoped<IRepository<GroupWishInvitation>, EfRepository<GroupWishInvitation>>();
        services.AddScoped<IRepository<GroupWishMemory>, EfRepository<GroupWishMemory>>();
        services.AddScoped<IRepository<AdminAuditEvent>, EfRepository<AdminAuditEvent>>();

        return services;
    }
}
