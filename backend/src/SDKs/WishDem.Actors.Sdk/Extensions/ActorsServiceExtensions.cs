using Akka.Actor;
using Akka.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using WishDem.Actors.Sdk.Abstractions;
using WishDem.Actors.Sdk.Actors;
using WishDem.Actors.Sdk.Configuration;
using WishDem.Actors.Sdk.Delivery;

namespace WishDem.Actors.Sdk.Extensions;

public static class ActorsServiceExtensions
{
    /// <summary>Wires the Akka.NET ActorSystem into DI and creates the top-level actors.
    /// The system is built with a DependencyResolverSetup so actors can be constructed
    /// with injected (scoped) services. An API calls this once at startup.</summary>
    public static IServiceCollection AddActorsSdk(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<DeliverySettings>(configuration.GetSection(DeliverySettings.SectionName));
        services.AddScoped<IWishDeliveryProcessor, WishDeliveryProcessor>();

        services.AddSingleton(provider =>
        {
            var setup = BootstrapSetup.Create()
                .And(DependencyResolverSetup.Create(provider));
            return ActorSystem.Create(ActorNames.System, setup);
        });

        services.AddSingleton<IActorGateway>(provider =>
        {
            var system = provider.GetRequiredService<ActorSystem>();
            var resolver = DependencyResolver.For(system);

            var deliveryDispatcher = system.ActorOf(
                resolver.Props<DeliveryDispatcherActor>(), ActorNames.DeliveryDispatcher);

            return new ActorGateway(deliveryDispatcher);
        });

        return services;
    }
}
