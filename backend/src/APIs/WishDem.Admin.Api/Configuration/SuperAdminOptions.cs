namespace WishDem.Admin.Api.Configuration;

/// <summary>Bootstraps the first admin account on startup, since admins never self-register.
/// Set via user-secrets/environment in real environments — never committed with a real password.</summary>
public class SuperAdminOptions
{
    public const string SectionName = "SuperAdmin";

    public string Email { get; set; } = "admin@wishdem.local";
    public string Password { get; set; } = "ChangeMe123!";
    public string FullName { get; set; } = "WishDem Admin";
}
