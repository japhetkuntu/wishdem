using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WishDem.Postgres.Sdk.Entities;

namespace WishDem.Postgres.Sdk.Persistence.Configurations;

public class GroupWishMemoryConfiguration : IEntityTypeConfiguration<GroupWishMemory>
{
    public void Configure(EntityTypeBuilder<GroupWishMemory> builder)
    {
        builder.ToTable("group_wish_memories", "core");

        builder.Property(x => x.Title).HasMaxLength(200);
        builder.Property(x => x.Body).HasMaxLength(4000);
        builder.Property(x => x.WhenWhere).HasMaxLength(200);
        builder.Property(x => x.AttachmentUrl).HasMaxLength(1000);

        builder.Property(x => x.Format).HasConversion<string>().HasMaxLength(32);

        builder.HasIndex(x => x.GroupWishId);

        builder.HasOne(x => x.Invitation)
            .WithMany()
            .HasForeignKey(x => x.InvitationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
