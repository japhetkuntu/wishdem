using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using WishDem.Messaging.Sdk.Abstractions;
using WishDem.Messaging.Sdk.Extensions;
using WishDem.Messaging.Sdk.Senders;
using Xunit;

namespace WishDem.Messaging.Sdk.Tests.Extensions;

public class MessagingServiceExtensionsTests
{
    private static IServiceProvider BuildProvider(Dictionary<string, string?> configValues)
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(configValues).Build();
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddMessagingSdk(configuration);
        return services.BuildServiceProvider();
    }

    [Fact]
    public void AddMessagingSdk_WithNoConfig_RegistersDevLogSenders()
    {
        var provider = BuildProvider(new Dictionary<string, string?>());

        provider.GetRequiredService<IEmailSender>().Should().BeOfType<DevLogEmailSender>();
        provider.GetRequiredService<ISmsSender>().Should().BeOfType<DevLogSmsSender>();
    }

    [Fact]
    public void AddMessagingSdk_WithMailtrapApiTokenConfigured_RegistersMailtrapEmailSender()
    {
        var provider = BuildProvider(new Dictionary<string, string?> { ["Mailtrap:ApiToken"] = "some-token" });

        provider.GetRequiredService<IEmailSender>().Should().BeOfType<MailtrapEmailSender>();
    }

    [Fact]
    public void AddMessagingSdk_WithArkeselApiKeyConfigured_RegistersArkeselSmsSender()
    {
        var provider = BuildProvider(new Dictionary<string, string?> { ["Sms:Arkesel:ApiKey"] = "some-key" });

        provider.GetRequiredService<ISmsSender>().Should().BeOfType<ArkeselSmsSender>();
    }
}
