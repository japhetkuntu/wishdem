namespace WishDem.Messaging.Sdk.Configuration;

/// <summary>SMTP relay settings — works with any SMTP-compatible provider (Gmail app
/// password, Mailgun, SendGrid SMTP relay, Postmark SMTP, a local dev catcher like
/// MailHog/Mailpit, etc). Leave Host empty to fall back to the dev-log sender.</summary>
public class SmtpOptions
{
    public const string SectionName = "Smtp";

    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = true;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromEmail { get; set; } = "no-reply@wishdem.local";
    public string FromName { get; set; } = "WishDem";
}
