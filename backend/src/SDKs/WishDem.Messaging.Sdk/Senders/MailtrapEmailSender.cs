using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WishDem.Messaging.Sdk.Abstractions;
using WishDem.Messaging.Sdk.Configuration;

namespace WishDem.Messaging.Sdk.Senders;

/// <summary>Real email delivery via Mailtrap's HTTP Send API (not SMTP) — a single
/// authenticated POST per message. Registered instead of DevLogEmailSender once
/// Mailtrap:ApiToken is configured. The HttpClient's BaseAddress is set at DI
/// registration time to either the live or sandbox host depending on Mailtrap:Sandbox.</summary>
public class MailtrapEmailSender(HttpClient httpClient, IOptions<MailtrapOptions> options, ILogger<MailtrapEmailSender> logger) : IEmailSender
{
    private readonly MailtrapOptions _options = options.Value;

    private record Address([property: JsonPropertyName("email")] string Email, [property: JsonPropertyName("name")] string? Name = null);

    private record SendEmailRequest(
        [property: JsonPropertyName("from")] Address From,
        [property: JsonPropertyName("to")] Address[] To,
        [property: JsonPropertyName("subject")] string Subject,
        [property: JsonPropertyName("text")] string Text);

    private record SendEmailResponse(
        [property: JsonPropertyName("success")] bool Success,
        [property: JsonPropertyName("errors")] string[]? Errors);

    public async Task SendAsync(string toEmail, string subject, string body, CancellationToken ct = default)
    {
        var request = new SendEmailRequest(
            From: new Address(_options.FromEmail, _options.FromName),
            To: [new Address(toEmail)],
            Subject: subject,
            Text: body);

        // Mailtrap's sandbox (testing) endpoint is scoped to a specific test inbox;
        // the live sending endpoint is a single shared path.
        var path = _options.Sandbox ? $"api/send/{_options.SandboxInboxId}" : "api/send";

        try
        {
            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, path)
            {
                Content = JsonContent.Create(request),
            };
            httpRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _options.ApiToken);

            using var response = await httpClient.SendAsync(httpRequest, ct);
            var responseBody = await response.Content.ReadFromJsonAsync<SendEmailResponse>(cancellationToken: ct);

            if (!response.IsSuccessStatusCode || responseBody?.Success != true)
            {
                var reason = responseBody?.Errors is { Length: > 0 } errors
                    ? string.Join("; ", errors)
                    : $"HTTP {(int)response.StatusCode}";
                logger.LogError("[MailtrapEmailSender] Send to {ToEmail} rejected: {Reason}", toEmail, reason);
                throw new MessagingException($"Mailtrap rejected the email to {toEmail}: {reason}");
            }
        }
        catch (MessagingException)
        {
            throw;
        }
        catch (Exception e)
        {
            logger.LogError(e, "[MailtrapEmailSender] Failed to send email to {ToEmail}", toEmail);
            throw new MessagingException($"Failed to send email to {toEmail}.", e);
        }
    }
}
