namespace WishDem.Actors.Sdk.Messages;

// The actor protocol. Each record is an immutable message Tell'd to a top-level actor.

/// <summary>-> DeliveryDispatcherActor -> round-robin DeliveryWorkerActor. The worker
/// reloads the wish itself by Id (rather than the caller passing the entity) so several
/// workers never share a tracked instance across concurrent mailboxes.</summary>
public sealed record DeliverWish(Guid WishId);
