namespace WishDem.Admin.Api.Models.Requests;

public record RefundPaymentRequest(decimal Amount, string Reason);
