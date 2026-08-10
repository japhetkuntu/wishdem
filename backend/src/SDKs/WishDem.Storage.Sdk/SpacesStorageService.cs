using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using Microsoft.Extensions.Options;
using WishDem.Storage.Sdk.Configuration;

namespace WishDem.Storage.Sdk;

/// <summary>DigitalOcean Spaces and MinIO are both S3-compatible, so this uses AWSSDK.S3 pointed
/// at whichever endpoint the environment configures. Objects are written public-read so they can
/// be served directly (or via a CDN in front of Spaces) without a signed-URL round trip.</summary>
public sealed class SpacesStorageService(IAmazonS3 s3, IOptions<StorageSettings> options) : IStorageService
{
    private readonly StorageSettings _settings = options.Value;

    public async Task<string> UploadAsync(UploadFileRequest request, CancellationToken ct = default)
    {
        try
        {
            var key = BuildKey(_settings.RootFolder, request.Folder, request.OriginalFileName);

            await using var stream = request.OpenContent();
            var uploadRequest = new TransferUtilityUploadRequest
            {
                BucketName = _settings.BucketName,
                Key = key,
                InputStream = stream,
                ContentType = request.ContentType,
                CannedACL = S3CannedACL.PublicRead,
            };

            var transferUtility = new TransferUtility(s3);
            await transferUtility.UploadAsync(uploadRequest, ct);

            return key;
        }
        catch (AmazonS3Exception ex)
        {
            throw new StorageException("Failed to upload the file to storage.", ex);
        }
    }

    public async Task DeleteAsync(string key, CancellationToken ct = default)
    {
        try
        {
            await s3.DeleteObjectAsync(new DeleteObjectRequest
            {
                BucketName = _settings.BucketName,
                Key = key,
            }, ct);
        }
        catch (AmazonS3Exception ex)
        {
            throw new StorageException("Failed to delete the file from storage.", ex);
        }
    }

    public string BuildPublicUrl(string key)
    {
        var endpoint = _settings.CdnEndpoint.TrimEnd('/');
        return _settings.ForcePathStyle
            ? $"{endpoint}/{_settings.BucketName}/{key}"
            : $"{endpoint}/{key}";
    }

    // {rootFolder}/{folder}/{yyyy/MM/dd}/{12-char-guid}{ext} — rootFolder segment is
    // omitted entirely when unset, so a single-project bucket's keys are unaffected.
    private static string BuildKey(string rootFolder, string folder, string originalFileName)
    {
        var datePart = DateTime.UtcNow.ToString("yyyy/MM/dd");
        var shortGuid = Guid.NewGuid().ToString("N")[..12];
        var ext = Path.GetExtension(originalFileName).ToLowerInvariant();
        var trimmedRoot = rootFolder.Trim('/');
        var prefix = string.IsNullOrEmpty(trimmedRoot) ? folder : $"{trimmedRoot}/{folder}";
        return $"{prefix}/{datePart}/{shortGuid}{ext}";
    }
}
