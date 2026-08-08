using Akka.Actor;
using Akka.DependencyInjection;
using Akka.Routing;
using WishDem.Actors.Sdk.Configuration;
using WishDem.Actors.Sdk.Messages;

namespace WishDem.Actors.Sdk.Actors;

/// <summary>Round-robin pool of DeliveryWorkerActor — this is what turns the previously
/// sequential per-wish delivery loop into concurrent work: each Tell'd wish lands on
/// whichever worker is free instead of waiting for the one before it to finish. The
/// supervisor restarts an individual worker on failure without dropping the rest of the
/// pool.</summary>
public sealed class DeliveryDispatcherActor : ReceiveActor
{
    private readonly IActorRef _workers;

    public DeliveryDispatcherActor()
    {
        var resolver = DependencyResolver.For(Context.System);
        var workerProps = resolver.Props<DeliveryWorkerActor>();

        _workers = Context.ActorOf(
            new RoundRobinPool(ActorNames.DeliveryWorkerCount).Props(workerProps),
            ActorNames.DeliveryWorkers);

        Receive<DeliverWish>(message => _workers.Forward(message));
    }

    protected override SupervisorStrategy SupervisorStrategy()
        => new OneForOneStrategy(
            maxNrOfRetries: 10,
            withinTimeRange: TimeSpan.FromMinutes(1),
            localOnlyDecider: _ => Directive.Restart);
}
