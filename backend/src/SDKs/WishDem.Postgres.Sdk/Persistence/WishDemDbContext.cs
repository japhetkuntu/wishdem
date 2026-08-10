using Microsoft.EntityFrameworkCore;
using WishDem.Postgres.Sdk.Entities;

namespace WishDem.Postgres.Sdk.Persistence;

/// <summary>The one shared database backing both the Admin and Customer APIs. Identity
/// tables (AdminUser/CustomerUser) live in the "identity" schema; domain tables (Wish)
/// live in "core" — a single DbContext keeps that simple rather than splitting into
/// per-API contexts, since both APIs genuinely operate on the same domain data.</summary>
public class WishDemDbContext(DbContextOptions<WishDemDbContext> options) : DbContext(options)
{
    public DbSet<CustomerUser> CustomerUsers => Set<CustomerUser>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<Wish> Wishes => Set<Wish>();
    public DbSet<CirclePerson> CirclePeople => Set<CirclePerson>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<ModerationCase> ModerationCases => Set<ModerationCase>();
    public DbSet<GroupWish> GroupWishes => Set<GroupWish>();
    public DbSet<GroupWishInvitation> GroupWishInvitations => Set<GroupWishInvitation>();
    public DbSet<GroupWishMemory> GroupWishMemories => Set<GroupWishMemory>();
    public DbSet<AdminAuditEvent> AdminAuditEvents => Set<AdminAuditEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(WishDemDbContext).Assembly);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            // Soft-delete filter applied everywhere so a removed row never resurfaces
            // through a forgotten query — repositories flip IsDeleted rather than deleting rows.
            if (typeof(Entities.BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType)
                    .HasQueryFilter(BuildSoftDeleteFilter(entityType.ClrType));
            }
        }
    }

    private static System.Linq.Expressions.LambdaExpression BuildSoftDeleteFilter(Type clrType)
    {
        var parameter = System.Linq.Expressions.Expression.Parameter(clrType, "e");
        var property = System.Linq.Expressions.Expression.Property(parameter, nameof(Entities.BaseEntity.IsDeleted));
        var condition = System.Linq.Expressions.Expression.Equal(property, System.Linq.Expressions.Expression.Constant(false));
        return System.Linq.Expressions.Expression.Lambda(condition, parameter);
    }
}
