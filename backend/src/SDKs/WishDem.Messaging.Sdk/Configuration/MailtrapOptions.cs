namespace WishDem.Messaging.Sdk.Configuration;

/// <summary>Mailtrap (mailtrap.io) transactional email settings, sent via their HTTP
/// Send API rather than SMTP. Leave ApiToken empty to fall back to the dev-log sender.</summary>
public class MailtrapOptions
{
    public const string SectionName = "Mailtrap";

    public string ApiToken { get; set; } = string.Empty;
    public string FromEmail { get; set; } = "no-reply@wishdem.local";
    public string FromName { get; set; } = "WishDem";

    /// <summary>When true, sends go to Mailtrap's sandbox testing endpoint (scoped to
    /// SandboxInboxId) instead of real recipients — nothing actually gets delivered,
    /// useful for verifying the integration without emailing real people.</summary>
    public bool Sandbox { get; set; }

    /// <summary>Required when Sandbox is true — the Mailtrap test inbox ID to post into.</summary>
    public string SandboxInboxId { get; set; } = string.Empty;
}
