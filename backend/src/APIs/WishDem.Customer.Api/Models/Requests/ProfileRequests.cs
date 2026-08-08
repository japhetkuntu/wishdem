namespace WishDem.Customer.Api.Models.Requests;

public record UpdateProfileRequest(
    string Name,
    string? AvatarUrl,
    DateOnly? DateOfBirth,
    string? Country,
    string? Region);
