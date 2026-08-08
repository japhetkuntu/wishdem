namespace WishDem.Actors.Sdk.Delivery;

/// <summary>Delivers a single wish by its own channel (Sms/WhatsApp/Link) and marks it
/// delivered on success. Scoped — reloads the wish fresh by Id so it never shares a
/// tracked entity across concurrent DeliveryWorkerActor invocations.</summary>
public interface IWishDeliveryProcessor
{
    /// <summary>Returns true if the wish was (or already had been) delivered. Returns false
    /// for a recoverable miss — e.g. a missing phone number or a provider-level send
    /// failure — so the next poll can retry rather than the actor treating it as a crash.</summary>
    Task<bool> DeliverAsync(Guid wishId, CancellationToken ct = default);
}
