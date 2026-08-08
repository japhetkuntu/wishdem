namespace WishDem.Customer.Api.Models.Requests;

public record RequestOtpRequest(string Email);

public record VerifyOtpRequest(string Email, string Code, string? Name);

public record GoogleSignInRequest(string IdToken);

public record RefreshTokenRequest(string RefreshToken);
