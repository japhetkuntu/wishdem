using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WishDem.Postgres.Sdk.Entities;

namespace WishDem.Postgres.Sdk.Persistence.Configurations;

public class ModerationCaseConfiguration : IEntityTypeConfiguration<ModerationCase>
{
    public void Configure(EntityTypeBuilder<ModerationCase> builder)
    {
        builder.ToTable("moderation_cases", "core");

        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(4000);
        builder.Property(x => x.EvidenceQuote).HasMaxLength(2000);
        builder.Property(x => x.ContentType).HasMaxLength(64);
        builder.Property(x => x.DecisionReason).HasMaxLength(1000);

        builder.Property(x => x.Severity).HasConversion<string>().HasMaxLength(32);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
        builder.Property(x => x.Decision).HasConversion<string>().HasMaxLength(32);

        builder.HasIndex(x => x.WishId);
        builder.HasIndex(x => x.Status);

        builder.HasOne(x => x.Wish)
            .WithMany()
            .HasForeignKey(x => x.WishId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.ReviewerAdminUser)
            .WithMany()
            .HasForeignKey(x => x.ReviewerAdminUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.AssignedAdminUser)
            .WithMany()
            .HasForeignKey(x => x.AssignedAdminUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
