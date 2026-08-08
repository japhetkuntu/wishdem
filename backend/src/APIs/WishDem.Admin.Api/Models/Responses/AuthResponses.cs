namespace WishDem.Admin.Api.Models.Responses;

public record AdminUserResponse(Guid Id, string Email, string FullName, string Role);

public record AuthTokenResponse(string AccessToken, string RefreshToken, DateTime ExpiresAtUtc, AdminUserResponse User);

public record PasswordResetRequestedResponse(string MaskedEmail, int ExpirySeconds, string? DevCode);
