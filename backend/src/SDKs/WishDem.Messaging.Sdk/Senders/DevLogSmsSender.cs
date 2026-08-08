using Microsoft.Extensions.Logging;
using WishDem.Messaging.Sdk.Abstractions;

namespace WishDem.Messaging.Sdk.Senders;

/// <summary>Dev-mode stand-in for a real SMS provider: logs the message instead of sending
/// it. Swap the DI registration for ArkeselSmsSender (or another ISmsSender) once
/// Sms:Arkesel:ApiKey is configured — nothing calling this interface needs to change.</summary>
public class DevLogSmsSender(ILogger<DevLogSmsSender> logger) : ISmsSender
{
    public Task SendAsync(string toPhoneNumber, string message, CancellationToken ct = default)
    {
        logger.LogInformation("[DEV SMS] To: {ToPhoneNumber}\n{Message}", toPhoneNumber, message);
        return Task.CompletedTask;
    }
}
