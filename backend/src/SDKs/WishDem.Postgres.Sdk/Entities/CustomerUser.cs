namespace WishDem.Postgres.Sdk.Entities;

/// <summary>A WishDem customer. Customers never set a password — they sign in with a
/// one-time email code or Google, matching the customer portal's passwordless flow.</summary>
public class CustomerUser : BaseEntity
{
    public required string Email { get; set; }
    public required string Name { get; set; }
    public string? GoogleSubject { get; set; }
    public DateTime? LastLoginAtUtc { get; set; }

    public string? AvatarUrl { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Country { get; set; }
    public string? Region { get; set; }

    public List<Wish> Wishes { get; set; } = [];
}
