using WishDem.Common.Sdk.Enums;

namespace WishDem.Customer.Api.Models.Requests;

public record InitiatePaymentRequest(string PhoneNumber, PaymentProvider Provider);

/// <summary>Dev-only: since there's no real MoMo gateway integration yet, this lets the
/// wizard's payment step be exercised end-to-end by manually resolving a pending payment,
/// standing in for the provider's webhook callback.</summary>
public record SimulatePaymentOutcomeRequest(bool Succeed, string? FailureReason);
