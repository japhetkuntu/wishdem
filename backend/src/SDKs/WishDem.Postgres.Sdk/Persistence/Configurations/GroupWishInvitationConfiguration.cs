using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WishDem.Postgres.Sdk.Entities;

namespace WishDem.Postgres.Sdk.Persistence.Configurations;

public class GroupWishInvitationConfiguration : IEntityTypeConfiguration<GroupWishInvitation>
{
    public void Configure(EntityTypeBuilder<GroupWishInvitation> builder)
    {
        builder.ToTable("group_wish_invitations", "core");

        builder.Property(x => x.InviteToken).HasMaxLength(64).IsRequired();
        builder.Property(x => x.GuestName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.GuestEmail).HasMaxLength(256);

        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);

        builder.HasIndex(x => x.InviteToken).IsUnique();
        builder.HasIndex(x => x.GroupWishId);
    }
}
