namespace WishDem.Messaging.Sdk.Abstractions;

public interface ISmsSender
{
    /// <summary>Sends a text message to a phone number. <paramref name="toPhoneNumber"/> should
    /// include the country code (e.g. "233241234567", no leading "+" — Arkesel's own convention).</summary>
    Task SendAsync(string toPhoneNumber, string message, CancellationToken ct = default);
}
