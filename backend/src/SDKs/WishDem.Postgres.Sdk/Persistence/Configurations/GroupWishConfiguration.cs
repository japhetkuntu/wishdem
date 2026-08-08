using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WishDem.Postgres.Sdk.Entities;

namespace WishDem.Postgres.Sdk.Persistence.Configurations;

public class GroupWishConfiguration : IEntityTypeConfiguration<GroupWish>
{
    public void Configure(EntityTypeBuilder<GroupWish> builder)
    {
        builder.ToTable("group_wishes", "core");

        builder.Property(x => x.Title).HasMaxLength(200).IsRequired();
        builder.Property(x => x.RecipientName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Occasion).HasMaxLength(100);
        builder.Property(x => x.Context).HasMaxLength(2000);
        builder.Property(x => x.OrganizerNote).HasMaxLength(2000);
        builder.Property(x => x.Formats).HasMaxLength(128);

        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);

        builder.HasIndex(x => x.OrganizerCustomerUserId);

        builder.HasOne(x => x.OrganizerCustomerUser)
            .WithMany()
            .HasForeignKey(x => x.OrganizerCustomerUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(x => x.Invitations)
            .WithOne(x => x.GroupWish)
            .HasForeignKey(x => x.GroupWishId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Memories)
            .WithOne(x => x.GroupWish)
            .HasForeignKey(x => x.GroupWishId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
