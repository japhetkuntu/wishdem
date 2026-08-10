namespace WishDem.Messaging.Sdk.Abstractions;

public interface IEmailSender
{
    /// <summary>htmlBody is optional so simple/internal notifications can stay plain text,
    /// but every user-facing email should pass one — providers (and this interface) always
    /// send the plain-text body alongside it as the fallback for clients that don't render
    /// HTML, so textBody should stay a complete, readable message on its own.</summary>
    Task SendAsync(string toEmail, string subject, string textBody, string? htmlBody = null, CancellationToken ct = default);
}
