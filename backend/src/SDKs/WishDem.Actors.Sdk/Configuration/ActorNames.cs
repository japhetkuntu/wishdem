namespace WishDem.Actors.Sdk.Configuration;

/// <summary>Stable names for the ActorSystem and its top-level actors — centralised so paths
/// never drift between creation and any future lookup.</summary>
public static class ActorNames
{
    public const string System = "wishdem";

    public const string DeliveryDispatcher = "delivery-dispatcher";
    public const string DeliveryWorkers = "delivery-workers";

    /// <summary>Round-robin pool size for wish-delivery workers — bounds how many
    /// deliveries run concurrently without needing one actor per wish.</summary>
    public const int DeliveryWorkerCount = 5;
}
