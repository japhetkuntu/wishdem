namespace WishDem.Admin.Api.Models.Requests;

public record InviteAdminUserRequest(string Email, string FullName, string Role);
