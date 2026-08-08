namespace WishDem.Actors.Sdk.Configuration;

/// <summary>Bound from the "DeliveryWorker" section. Owned here (rather than by the API
/// project) because the actual delivery — including building the recipient's link — now
/// happens inside DeliveryWorkerActor.</summary>
public sealed class DeliverySettings
{
    public const string SectionName = "DeliveryWorker";

    public int PollIntervalSeconds { get; set; } = 60;

    /// <summary>Base URL of the customer-portal frontend, used to build the recipient's
    /// shareable wish link (e.g. "https://app.wishdem.com/w/{wishId}").</summary>
    public string FrontendBaseUrl { get; set; } = "http://localhost:5173";
}
