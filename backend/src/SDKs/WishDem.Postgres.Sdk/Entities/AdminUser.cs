namespace WishDem.Postgres.Sdk.Entities;

/// <summary>An internal WishDem operations account. Admins are seeded or invited —
/// there is no public self-registration endpoint for this table.</summary>
public class AdminUser : BaseEntity
{
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public required string FullName { get; set; }
    public string Role { get; set; } = "OperationsAdmin";
    public bool IsActive { get; set; } = true;

    /// <summary>Bumped whenever the password changes. Included as a JWT claim so tokens
    /// issued before a password change/reset stop being renewable — "signs out other devices".</summary>
    public int TokenVersion { get; set; }

    public DateTime? LastLoginAtUtc { get; set; }
}
