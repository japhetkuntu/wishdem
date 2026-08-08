using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using WishDem.Messaging.Sdk.Abstractions;
using WishDem.Messaging.Sdk.Configuration;

namespace WishDem.Messaging.Sdk.Senders;

/// <summary>Real email delivery over SMTP via MailKit — works with any SMTP-compatible
/// provider. Registered instead of DevLogEmailSender once Smtp:Host is configured.</summary>
public class SmtpEmailSender(IOptions<SmtpOptions> options, ILogger<SmtpEmailSender> logger) : IEmailSender
{
    private readonly SmtpOptions _options = options.Value;

    public async Task SendAsync(string toEmail, string subject, string body, CancellationToken ct = default)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_options.FromName, _options.FromEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new TextPart("plain") { Text = body };

        try
        {
            using var client = new SmtpClient();
            var socketOptions = _options.UseSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None;
            await client.ConnectAsync(_options.Host, _options.Port, socketOptions, ct);

            if (!string.IsNullOrEmpty(_options.Username))
                await client.AuthenticateAsync(_options.Username, _options.Password, ct);

            await client.SendAsync(message, ct);
            await client.DisconnectAsync(true, ct);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[SmtpEmailSender] Failed to send email to {ToEmail}", toEmail);
            throw new MessagingException($"Failed to send email to {toEmail}.", e);
        }
    }
}
