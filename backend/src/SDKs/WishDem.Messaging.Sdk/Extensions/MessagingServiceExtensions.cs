using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using WishDem.Messaging.Sdk.Abstractions;
using WishDem.Messaging.Sdk.Configuration;
using WishDem.Messaging.Sdk.Senders;

namespace WishDem.Messaging.Sdk.Extensions;

public static class MessagingServiceExtensions
{
    public static IServiceCollection AddMessagingSdk(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<MailtrapOptions>(configuration.GetSection(MailtrapOptions.SectionName));
        services.Configure<ArkeselOptions>(configuration.GetSection(ArkeselOptions.SectionName));

        // Real providers activate the moment their config is present — no code change
        // needed to go from local dev (logging only) to a live environment, just secrets.
        var mailtrapApiToken = configuration[$"{MailtrapOptions.SectionName}:{nameof(MailtrapOptions.ApiToken)}"];
        if (!string.IsNullOrWhiteSpace(mailtrapApiToken))
        {
            services.AddHttpClient<MailtrapEmailSender>((sp, client) =>
            {
                var mailtrapOptions = sp.GetRequiredService<IOptions<MailtrapOptions>>().Value;
                client.BaseAddress = new Uri(mailtrapOptions.Sandbox
                    ? "https://sandbox.api.mailtrap.io"
                    : "https://send.api.mailtrap.io");
            });
            services.AddSingleton<IEmailSender>(sp => sp.GetRequiredService<MailtrapEmailSender>());
        }
        else
        {
            services.AddSingleton<IEmailSender, DevLogEmailSender>();
        }

        var arkeselApiKey = configuration[$"{ArkeselOptions.SectionName}:{nameof(ArkeselOptions.ApiKey)}"];
        if (!string.IsNullOrWhiteSpace(arkeselApiKey))
        {
            services.AddHttpClient<ArkeselSmsSender>((sp, client) =>
            {
                var arkeselOptions = sp.GetRequiredService<IOptions<ArkeselOptions>>().Value;
                client.BaseAddress = new Uri(arkeselOptions.BaseUrl);
            });
            services.AddSingleton<ISmsSender>(sp => sp.GetRequiredService<ArkeselSmsSender>());
        }
        else
        {
            services.AddSingleton<ISmsSender, DevLogSmsSender>();
        }

        return services;
    }
}
