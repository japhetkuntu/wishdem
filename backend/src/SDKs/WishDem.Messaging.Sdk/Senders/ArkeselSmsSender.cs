using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WishDem.Messaging.Sdk.Abstractions;
using WishDem.Messaging.Sdk.Configuration;

namespace WishDem.Messaging.Sdk.Senders;

/// <summary>Real SMS delivery via Arkesel (sms.arkesel.com) — a single authenticated
/// POST per message. Registered instead of DevLogSmsSender once Sms:Arkesel:ApiKey is
/// configured. SenderId must already be registered in the Arkesel dashboard.</summary>
public class ArkeselSmsSender(HttpClient httpClient, IOptions<ArkeselOptions> options, ILogger<ArkeselSmsSender> logger) : ISmsSender
{
    private readonly ArkeselOptions _options = options.Value;

    private record SendSmsRequest(
        [property: JsonPropertyName("sender")] string Sender,
        [property: JsonPropertyName("message")] string Message,
        [property: JsonPropertyName("recipients")] string[] Recipients);

    private record SendSmsResponse(
        [property: JsonPropertyName("status")] string? Status,
        [property: JsonPropertyName("message")] string? Message);

    public async Task SendAsync(string toPhoneNumber, string message, CancellationToken ct = default)
    {
        var normalizedPhone = NormalizePhoneNumber(toPhoneNumber);
        var request = new SendSmsRequest(_options.SenderId, message, [normalizedPhone]);

        try
        {
            using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "/api/v2/sms/send")
            {
                Content = JsonContent.Create(request),
            };
            httpRequest.Headers.Add("api-key", _options.ApiKey);

            using var response = await httpClient.SendAsync(httpRequest, ct);
            var body = await response.Content.ReadFromJsonAsync<SendSmsResponse>(cancellationToken: ct);

            if (!response.IsSuccessStatusCode || !string.Equals(body?.Status, "success", StringComparison.OrdinalIgnoreCase))
            {
                var reason = body?.Message ?? $"HTTP {(int)response.StatusCode}";
                logger.LogError("[ArkeselSmsSender] Send to {Phone} rejected: {Reason}", normalizedPhone, reason);
                throw new MessagingException($"Arkesel rejected the SMS to {normalizedPhone}: {reason}");
            }
        }
        catch (MessagingException)
        {
            throw;
        }
        catch (Exception e)
        {
            logger.LogError(e, "[ArkeselSmsSender] Failed to send SMS to {Phone}", normalizedPhone);
            throw new MessagingException($"Failed to send SMS to {normalizedPhone}.", e);
        }
    }

    /// <summary>Arkesel expects digits with country code and no leading "+" (e.g.
    /// "233241234567"). Strips non-digits, and converts the common Ghanaian local format
    /// ("024...", 10 digits) to its 233-country-code form since that's what customers
    /// actually type into the mobile money field.</summary>
    internal static string NormalizePhoneNumber(string phoneNumber)
    {
        var digits = new string(phoneNumber.Where(char.IsDigit).ToArray());
        if (digits.Length == 10 && digits.StartsWith('0')) return $"233{digits[1..]}";
        return digits;
    }
}
