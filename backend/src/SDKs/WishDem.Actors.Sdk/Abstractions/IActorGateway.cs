using Akka.Actor;

namespace WishDem.Actors.Sdk.Abstractions;

/// <summary>Single injection point services use to reach the top-level actors. A service
/// injects IActorGateway and Tells the relevant IActorRef instead of awaiting the
/// underlying work directly — that's what makes it concurrent and non-blocking. Resolved
/// as a singleton once the ActorSystem is built.</summary>
public interface IActorGateway
{
    IActorRef DeliveryDispatcher { get; }
}

internal sealed class ActorGateway(IActorRef deliveryDispatcher) : IActorGateway
{
    public IActorRef DeliveryDispatcher { get; } = deliveryDispatcher;
}
