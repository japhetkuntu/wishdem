using WishDem.Common.Sdk.Enums;

namespace WishDem.Customer.Api.Models.Responses;

public record PaymentResponse(
    Guid Id,
    Guid WishId,
    string PhoneNumber,
    PaymentProvider Provider,
    decimal Amount,
    PaymentStatus Status,
    string? FailureReason,
    DateTime? SettledAtUtc,
    DateTime CreatedAtUtc);
