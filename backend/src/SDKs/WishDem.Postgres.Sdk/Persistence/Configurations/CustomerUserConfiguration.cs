using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WishDem.Postgres.Sdk.Entities;

namespace WishDem.Postgres.Sdk.Persistence.Configurations;

public class CustomerUserConfiguration : IEntityTypeConfiguration<CustomerUser>
{
    public void Configure(EntityTypeBuilder<CustomerUser> builder)
    {
        builder.ToTable("customer_users", "identity");

        builder.Property(x => x.Email).HasMaxLength(256).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.GoogleSubject).HasMaxLength(128);
        builder.Property(x => x.AvatarUrl).HasMaxLength(2048);
        builder.Property(x => x.Country).HasMaxLength(100);
        builder.Property(x => x.Region).HasMaxLength(100);

        builder.HasIndex(x => x.Email).IsUnique();
        builder.HasIndex(x => x.GoogleSubject).IsUnique();

        builder.HasMany(x => x.Wishes)
            .WithOne(x => x.CustomerUser)
            .HasForeignKey(x => x.CustomerUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
