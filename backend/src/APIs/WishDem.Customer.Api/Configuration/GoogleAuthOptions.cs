namespace WishDem.Customer.Api.Configuration;

public class GoogleAuthOptions
{
    public const string SectionName = "GoogleAuth";

    /// <summary>OAuth client ID from Google Cloud Console. Required for ID-token
    /// verification — set via user-secrets, never committed.</summary>
    public string ClientId { get; set; } = string.Empty;
}
