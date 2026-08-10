namespace WishDem.Admin.Api.Models.Responses;

public record TeamMemberResponse(
    Guid Id,
    string Email,
    string FullName,
    string Role,
    bool IsActive,
    DateTime? LastLoginAtUtc,
    DateTime CreatedAtUtc);
