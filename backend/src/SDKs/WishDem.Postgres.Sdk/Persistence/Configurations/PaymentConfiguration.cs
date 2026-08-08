using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WishDem.Postgres.Sdk.Entities;

namespace WishDem.Postgres.Sdk.Persistence.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("payments", "core");

        builder.Property(x => x.PhoneNumber).HasMaxLength(32).IsRequired();
        builder.Property(x => x.ProviderReference).HasMaxLength(128);
        builder.Property(x => x.FailureReason).HasMaxLength(500);
        builder.Property(x => x.RefundReason).HasMaxLength(500);
        builder.Property(x => x.Amount).HasColumnType("numeric(10,2)");
        builder.Property(x => x.RefundAmount).HasColumnType("numeric(10,2)");

        builder.Property(x => x.Provider).HasConversion<string>().HasMaxLength(32);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);

        builder.HasIndex(x => x.WishId);
        builder.HasIndex(x => x.Status);

        builder.HasOne(x => x.Wish)
            .WithMany()
            .HasForeignKey(x => x.WishId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
