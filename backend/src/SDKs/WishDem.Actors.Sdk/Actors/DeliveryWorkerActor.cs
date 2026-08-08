using Akka.Actor;
using Akka.Event;
using Microsoft.Extensions.DependencyInjection;
using WishDem.Actors.Sdk.Delivery;
using WishDem.Actors.Sdk.Messages;

namespace WishDem.Actors.Sdk.Actors;

/// <summary>One worker handles exactly one wish delivery at a time, inside a fresh DI scope
/// (IRepository/ISmsSender are scoped). Only lets genuinely unexpected exceptions escape —
/// IWishDeliveryProcessor already swallows expected send failures — so the supervisor's
/// restart is reserved for real crashes, not routine SMS provider hiccups.</summary>
public sealed class DeliveryWorkerActor : ReceiveActor
{
    private readonly IServiceProvider _services;
    private readonly ILoggingAdapter _log = Context.GetLogger();

    public DeliveryWorkerActor(IServiceProvider services)
    {
        _services = services;
        ReceiveAsync<DeliverWish>(HandleAsync);
    }

    private async Task HandleAsync(DeliverWish message)
    {
        using var scope = _services.CreateScope();
        var processor = scope.ServiceProvider.GetRequiredService<IWishDeliveryProcessor>();

        var delivered = await processor.DeliverAsync(message.WishId);
        if (delivered)
            _log.Debug("Wish {0} delivered.", message.WishId);
    }

    protected override SupervisorStrategy SupervisorStrategy()
        => new OneForOneStrategy(
            maxNrOfRetries: 10,
            withinTimeRange: TimeSpan.FromMinutes(1),
            localOnlyDecider: _ => Directive.Restart);
}
