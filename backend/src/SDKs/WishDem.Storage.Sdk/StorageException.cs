namespace WishDem.Storage.Sdk;

/// <summary>Thrown when the storage provider (DigitalOcean Spaces, MinIO) rejects or fails an
/// upload/delete — callers decide whether to retry, log, or surface this to the user.</summary>
public sealed class StorageException(string message, Exception? inner = null) : Exception(message, inner);
