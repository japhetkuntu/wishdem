using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace WishDem.Postgres.Sdk.Persistence.DesignTime;

/// <summary>Lets `dotnet ef migrations add` run directly against this class library
/// (which has no Program.cs of its own to bootstrap a host) using a local dev
/// connection string. Never used at runtime — the real APIs configure the context
/// via AddPostgresSdk with the connection string from their own appsettings.</summary>
public class WishDemDbContextFactory : IDesignTimeDbContextFactory<WishDemDbContext>
{
    public WishDemDbContext CreateDbContext(string[] args)
    {
        const string connectionString = "Host=localhost;Port=5432;Database=WishDem;Username=wishdem;Password=localdev";

        var optionsBuilder = new DbContextOptionsBuilder<WishDemDbContext>();
        optionsBuilder.UseNpgsql(connectionString, o => o.MigrationsHistoryTable("__ef_migrations_history", "core"));

        return new WishDemDbContext(optionsBuilder.Options);
    }
}
