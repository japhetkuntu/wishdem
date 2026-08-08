namespace WishDem.Messaging.Sdk;

/// <summary>Thrown when a real provider (SMTP, Arkesel) rejects or fails to deliver a
/// message — callers decide whether to retry, log, or surface this to the user.</summary>
public sealed class MessagingException(string message, Exception? inner = null) : Exception(message, inner);
