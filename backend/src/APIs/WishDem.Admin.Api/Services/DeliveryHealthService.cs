using WishDem.Admin.Api.Interfaces;
using WishDem.Admin.Api.Models.Responses;
using WishDem.Common.Sdk.Enums;
using WishDem.Common.Sdk.Responses;
using WishDem.Postgres.Sdk.Delivery;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Admin.Api.Services;

/// <summary>Computed view over Wish lifecycle fields, backed by the same real delivery
/// worker's timing logic (WishDeliveryTiming) that actually sends wishes — this view can
/// never disagree with what the worker itself considers "due".</summary>
public class DeliveryHealthService(IRepository<Wish> wishes, ILogger<DeliveryHealthService> logger) : IDeliveryHealthService
{
    public async Task<IApiResponse<DeliveryHealthResponse>> GetHealthAsync(CancellationToken ct = default)
    {
        try
        {
            var draft = wishes.GetQueryable().Count(w => w.Status == WishStatus.Draft);
            var delivered = wishes.GetQueryable().Count(w => w.DeliveredAtUtc != null && w.OpenedAtUtc == null);
            var opened = wishes.GetQueryable().Count(w => w.OpenedAtUtc != null);

            var candidates = await wishes.FindManyAsync(w => w.Status == WishStatus.Sealed && w.DeliveredAtUtc == null, ct);
            var now = DateTime.UtcNow;
            var due = candidates.Count(w => WishDeliveryTiming.IsDue(w, now));

            var result = new DeliveryHealthResponse(draft, due, delivered, opened);
            return result.ToOkApiResponse("Delivery health retrieved successfully.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[GetHealthAsync] Failed to compute delivery health");
            return ApiResponseFactory.InternalError<DeliveryHealthResponse>("Failed to retrieve delivery health.");
        }
    }
}
