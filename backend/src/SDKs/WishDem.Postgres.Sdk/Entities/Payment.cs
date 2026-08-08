using WishDem.Common.Sdk.Enums;

namespace WishDem.Postgres.Sdk.Entities;

/// <summary>A mobile-money payment attempt for sealing a Wish. Both the Customer API
/// (initiating/checking payment) and the Admin API (reconciliation/refunds) use this table.</summary>
public class Payment : BaseEntity
{
    public Guid WishId { get; set; }
    public Wish? Wish { get; set; }

    public required string PhoneNumber { get; set; }
    public PaymentProvider Provider { get; set; }
    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string? ProviderReference { get; set; }
    public string? FailureReason { get; set; }
    public DateTime? SettledAtUtc { get; set; }

    public decimal? RefundAmount { get; set; }
    public string? RefundReason { get; set; }
    public DateTime? RefundedAtUtc { get; set; }
}
