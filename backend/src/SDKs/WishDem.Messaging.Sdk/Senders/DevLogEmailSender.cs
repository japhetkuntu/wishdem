using Microsoft.Extensions.Logging;
using WishDem.Messaging.Sdk.Abstractions;

namespace WishDem.Messaging.Sdk.Senders;

/// <summary>Dev-mode stand-in for a real email provider: logs the message instead of sending
/// it. Swap the DI registration for a real IEmailSender (SendGrid/SES/SMTP) when you have
/// credentials — nothing calling this interface needs to change.</summary>
public class DevLogEmailSender(ILogger<DevLogEmailSender> logger) : IEmailSender
{
    public Task SendAsync(string toEmail, string subject, string body, CancellationToken ct = default)
    {
        logger.LogInformation(
            "[DEV EMAIL] To: {ToEmail} | Subject: {Subject}\n{Body}",
            toEmail, subject, body);
        return Task.CompletedTask;
    }
}
