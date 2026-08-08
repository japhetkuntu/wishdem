using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WishDem.Postgres.Sdk.Entities;

namespace WishDem.Postgres.Sdk.Persistence.Configurations;

public class CirclePersonConfiguration : IEntityTypeConfiguration<CirclePerson>
{
    public void Configure(EntityTypeBuilder<CirclePerson> builder)
    {
        builder.ToTable("circle_people", "core");

        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.RelationshipLabel).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Timezone).HasMaxLength(100);
        builder.Property(x => x.Note).HasMaxLength(2000);
        builder.Property(x => x.Group).HasConversion<string>().HasMaxLength(32);

        builder.HasIndex(x => x.CustomerUserId);

        builder.HasOne(x => x.CustomerUser)
            .WithMany()
            .HasForeignKey(x => x.CustomerUserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
