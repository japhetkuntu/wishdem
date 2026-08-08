using WishDem.Common.Sdk.Enums;

namespace WishDem.Admin.Api.Models.Responses;

public record AdminPaymentResponse(
    Guid Id,
    Guid WishId,
    string SenderName,
    string PhoneNumber,
    PaymentProvider Provider,
    decimal Amount,
    PaymentStatus Status,
    string? FailureReason,
    bool ReconciliationMismatch,
    decimal? RefundAmount,
    string? RefundReason,
    DateTime? RefundedAtUtc,
    DateTime? SettledAtUtc,
    DateTime CreatedAtUtc);
