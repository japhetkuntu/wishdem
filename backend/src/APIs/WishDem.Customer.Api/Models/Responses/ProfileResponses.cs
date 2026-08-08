namespace WishDem.Customer.Api.Models.Responses;

public record ProfileResponse(
    Guid Id,
    string Email,
    string Name,
    string? AvatarUrl,
    DateOnly? DateOfBirth,
    string? Country,
    string? Region);
