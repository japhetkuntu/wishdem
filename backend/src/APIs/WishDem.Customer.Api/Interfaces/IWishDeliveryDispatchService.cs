namespace WishDem.Customer.Api.Interfaces;

public interface IWishDeliveryDispatchService
{
    /// <summary>Finds sealed, undelivered wishes whose scheduled moment has arrived and
    /// hands each one to the delivery actor pool for concurrent processing. Returns how
    /// many were handed off this pass — not how many finished delivering, since that now
    /// happens asynchronously across DeliveryWorkerActor instances. A wish that fails to
    /// send is left undelivered for the next poll rather than aborting the whole batch.</summary>
    Task<int> DispatchDueWishesAsync(CancellationToken ct = default);
}
