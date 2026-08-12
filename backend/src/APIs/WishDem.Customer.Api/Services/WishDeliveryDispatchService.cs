using Akka.Actor;
using WishDem.Actors.Sdk.Abstractions;
using WishDem.Actors.Sdk.Messages;
using WishDem.Common.Sdk.Enums;
using WishDem.Customer.Api.Interfaces;
using WishDem.Postgres.Sdk.Delivery;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Customer.Api.Services;

/// <summary>Finds which sealed wishes are due and hands each one off to the delivery actor
/// pool — this is what the messaging pipeline was missing before: Sealed wishes just sat
/// there forever with no delivery mechanism. Called periodically by
/// WishDeliveryBackgroundService. Tell is fire-and-forget: this method returns as soon as
/// every due wish has been handed off, not once they're all actually delivered — the
/// DeliveryDispatcherActor's worker pool processes them concurrently in the background.</summary>
public class WishDeliveryDispatchService(
    IRepository<Wish> wishes,
    IActorGateway actors,
    ILogger<WishDeliveryDispatchService> logger) : IWishDeliveryDispatchService
{
    public async Task<int> DispatchDueWishesAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var candidates = await wishes.FindManyAsync(
            w => w.Status == WishStatus.Sealed && w.DeliveredAtUtc == null
                && (w.NextDeliveryAttemptAtUtc == null || w.NextDeliveryAttemptAtUtc <= now),
            ct);
        var dueWishes = candidates.Where(w => WishDeliveryTiming.IsDue(w, now)).ToList();
        foreach (var wish in dueWishes)
            actors.DeliveryDispatcher.Tell(new DeliverWish(wish.Id), ActorRefs.NoSender);

        if (dueWishes.Count > 0)
            logger.LogInformation("[DispatchDueWishesAsync] Handed off {Count} due wish(es) to the delivery actor pool.", dueWishes.Count);

        return dueWishes.Count;
    }
}
