namespace WishDem.Storage.Sdk.Configuration;

/// <summary>Bound from the "Storage" section. DigitalOcean Spaces (prod) and MinIO (local dev)
/// are both S3-compatible, so the same settings shape and client work against either — only the
/// values differ per environment.</summary>
public sealed class StorageSettings
{
    public const string SectionName = "Storage";

    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string BucketName { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;    // e.g. fra1.digitaloceanspaces.com, or http://localhost:9000 for MinIO
    public string CdnEndpoint { get; set; } = string.Empty; // e.g. cdn.wishdem.com, or the MinIO endpoint locally

    /// <summary>MinIO requires path-style URLs (host/bucket/key); DigitalOcean Spaces expects
    /// virtual-hosted-style (bucket.host/key). Must match whichever provider Endpoint points at.</summary>
    public bool ForcePathStyle { get; set; }
}
