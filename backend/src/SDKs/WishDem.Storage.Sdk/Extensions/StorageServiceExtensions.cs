using Amazon.Runtime;
using Amazon.S3;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using WishDem.Storage.Sdk.Configuration;

namespace WishDem.Storage.Sdk.Extensions;

public static class StorageServiceExtensions
{
    public static IServiceCollection AddStorageSdk(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<StorageSettings>(configuration.GetSection(StorageSettings.SectionName));

        services.AddSingleton<IAmazonS3>(_ =>
        {
            var settings = new StorageSettings();
            configuration.GetSection(StorageSettings.SectionName).Bind(settings);

            var config = new AmazonS3Config
            {
                ServiceURL = settings.Endpoint,
                ForcePathStyle = settings.ForcePathStyle,
            };

            var credentials = new BasicAWSCredentials(settings.AccessKey, settings.SecretKey);
            return new AmazonS3Client(credentials, config);
        });

        services.AddSingleton<IStorageService, SpacesStorageService>();

        return services;
    }
}
