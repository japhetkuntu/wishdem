using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WishDem.Postgres.Sdk.Entities;

namespace WishDem.Postgres.Sdk.Persistence.Configurations;

public class WishConfiguration : IEntityTypeConfiguration<Wish>
{
    public void Configure(EntityTypeBuilder<Wish> builder)
    {
        builder.ToTable("wishes", "core");

        builder.Property(x => x.FromName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.RecipientName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.RecipientRelationship).HasMaxLength(100).IsRequired();
        builder.Property(x => x.RecipientTimezone).HasMaxLength(100).IsRequired();
        builder.Property(x => x.RecipientPhoneNumber).HasMaxLength(32);
        builder.Property(x => x.Message).HasMaxLength(4000);
        builder.Property(x => x.ThemeId).HasMaxLength(64);
        builder.Property(x => x.PriceLabel).HasMaxLength(32);

        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
        builder.Property(x => x.Channel).HasConversion<string>().HasMaxLength(32);
        builder.Property(x => x.AttachmentKind).HasConversion<string>().HasMaxLength(32);

        builder.HasIndex(x => x.CustomerUserId);
        builder.HasIndex(x => x.Status);
        // Delivery-worker polling and admin dashboards filter/sort by these frequently.
        builder.HasIndex(x => x.DeliveredAtUtc);
        builder.HasIndex(x => x.OpenedAtUtc);
        builder.HasIndex(x => x.SealedAtUtc);
        builder.HasIndex(x => x.NextDeliveryAttemptAtUtc);
    }
}
