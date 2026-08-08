namespace WishDem.Messaging.Sdk.Configuration;

/// <summary>Arkesel (sms.arkesel.com) SMS gateway settings. Leave ApiKey empty to fall
/// back to the dev-log sender. SenderId must be pre-registered in the Arkesel dashboard
/// before it can be used — Arkesel rejects unregistered sender IDs.</summary>
public class ArkeselOptions
{
    public const string SectionName = "Sms:Arkesel";

    public string BaseUrl { get; set; } = "https://sms.arkesel.com";
    public string ApiKey { get; set; } = string.Empty;
    public string SenderId { get; set; } = "WishDem";
}
