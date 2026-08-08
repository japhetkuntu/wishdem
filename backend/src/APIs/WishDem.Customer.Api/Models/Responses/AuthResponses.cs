namespace WishDem.Customer.Api.Models.Responses;

public record OtpRequestedResponse(bool IsNewCustomer, string MaskedEmail, int ExpiresInSeconds, string? DevCode);

public record CustomerUserResponse(Guid Id, string Email, string Name);

public record AuthTokenResponse(string AccessToken, string RefreshToken, DateTime ExpiresAtUtc, CustomerUserResponse User);
