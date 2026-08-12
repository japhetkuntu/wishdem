using WishDem.Admin.Api.Interfaces;
using WishDem.Admin.Api.Models.Responses;
using WishDem.Common.Sdk.Enums;
using WishDem.Common.Sdk.Exceptions;
using WishDem.Common.Sdk.Responses;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Admin.Api.Services;

public class WishOversightService(
    IRepository<Wish> wishes,
    IRepository<CustomerUser> customerUsers,
    IAuditLogService auditLog,
    ILogger<WishOversightService> logger) : IWishOversightService
{
    public async Task<IApiResponse<PagedResult<AdminWishResponse>>> GetAllAsync(int pageIndex, int pageSize, WishStatus? status, CancellationToken ct = default)
    {
        try
        {
            var page = await wishes.GetPagedAsync(
                pageIndex,
                pageSize,
                filter: status.HasValue ? w => w.Status == status.Value : null,
                orderBy: q => q.OrderByDescending(w => w.CreatedAtUtc),
                ct: ct);

            var customerIds = page.Items.Select(w => w.CustomerUserId).Distinct().ToList();
            var customers = await customerUsers.FindManyAsync(u => customerIds.Contains(u.Id), ct);
            var customersById = customers.ToDictionary(u => u.Id);

            var result = new PagedResult<AdminWishResponse>
            {
                Items = page.Items.Select(w => ToResponse(w, customersById.GetValueOrDefault(w.CustomerUserId))).ToList(),
                PageIndex = page.PageIndex,
                PageSize = page.PageSize,
                TotalCount = page.TotalCount,
            };

            return result.ToOkApiResponse("Wishes retrieved successfully.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[GetAllAsync] Failed to list wishes");
            return ApiResponseFactory.InternalError<PagedResult<AdminWishResponse>>("Failed to retrieve wishes.");
        }
    }

    public async Task<IApiResponse<AdminWishResponse>> GetByIdAsync(Guid wishId, CancellationToken ct = default)
    {
        try
        {
            var wish = await GetWishAsync(wishId, ct);
            var customer = await customerUsers.GetByIdAsync(wish.CustomerUserId, ct);
            return ToResponse(wish, customer).ToOkApiResponse("Wish retrieved successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<AdminWishResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[GetByIdAsync] Failed to get wish {WishId}", wishId);
            return ApiResponseFactory.InternalError<AdminWishResponse>("Failed to retrieve wish.");
        }
    }

    public async Task<IApiResponse<AdminWishResponse>> UpdateStatusAsync(Guid adminUserId, Guid wishId, WishStatus status, CancellationToken ct = default)
    {
        try
        {
            var wish = await GetWishAsync(wishId, ct);
            wish.Status = status;
            await wishes.UpdateAsync(wish, ct);

            var customer = await customerUsers.GetByIdAsync(wish.CustomerUserId, ct);
            await auditLog.LogAsync(adminUserId, "wish.status.update", "Wish", wish.Id, $"changed wish {wish.Id} status to {status}", ct: ct);
            return ToResponse(wish, customer).ToOkApiResponse("Wish status updated successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<AdminWishResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[UpdateStatusAsync] Failed to update status for wish {WishId}", wishId);
            return ApiResponseFactory.InternalError<AdminWishResponse>("Failed to update wish status.");
        }
    }

    public async Task<IApiResponse<bool>> DeleteAsync(Guid adminUserId, Guid wishId, CancellationToken ct = default)
    {
        try
        {
            var wish = await GetWishAsync(wishId, ct);
            await wishes.RemoveAsync(wish, ct);
            await auditLog.LogAsync(adminUserId, "wish.cancel", "Wish", wish.Id, $"cancelled wish {wish.Id}", AuditTag.CriticalAccess, ct);
            return true.ToOkApiResponse("Wish deleted successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<bool>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[DeleteAsync] Failed to delete wish {WishId}", wishId);
            return ApiResponseFactory.InternalError<bool>("Failed to delete wish.");
        }
    }

    public async Task<IApiResponse<AdminWishResponse>> RedeliverAsync(Guid adminUserId, Guid wishId, CancellationToken ct = default)
    {
        try
        {
            // The dispatch worker's query only ever picks up wishes with Status == Sealed
            // (see WishDeliveryDispatchService) — once a wish reaches Delivered or Opened,
            // clearing DeliveredAtUtc/OpenedAtUtc alone left it permanently invisible to
            // that query, so this used to silently no-op for any wish that had actually
            // gone out. Resetting Status back to Sealed, and clearing the backoff fields so
            // no stale delay is left over, puts it back in front of the worker for real —
            // it goes out on the very next poll instead of requiring a real-time queue.
            var wish = await GetWishAsync(wishId, ct);
            wish.Status = WishStatus.Sealed;
            wish.DeliveredAtUtc = null;
            wish.OpenedAtUtc = null;
            wish.NextDeliveryAttemptAtUtc = null;
            wish.DeliveryAttemptCount = 0;
            await wishes.UpdateAsync(wish, ct);

            var customer = await customerUsers.GetByIdAsync(wish.CustomerUserId, ct);
            await auditLog.LogAsync(adminUserId, "wish.redeliver", "Wish", wish.Id, $"retried delivery for wish {wish.Id}", ct: ct);
            return ToResponse(wish, customer).ToOkApiResponse("Wish queued for redelivery.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<AdminWishResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[RedeliverAsync] Failed to redeliver wish {WishId}", wishId);
            return ApiResponseFactory.InternalError<AdminWishResponse>("Failed to redeliver wish.");
        }
    }

    private async Task<Wish> GetWishAsync(Guid wishId, CancellationToken ct) =>
        await wishes.GetByIdAsync(wishId, ct) ?? throw new NotFoundException("That wish could not be found.");

    private static AdminWishResponse ToResponse(Wish w, CustomerUser? customer) => new(
        w.Id,
        w.CustomerUserId,
        customer?.Email ?? "unknown",
        customer?.Name ?? "unknown",
        w.FromName,
        w.RecipientName,
        w.RecipientRelationship,
        w.RecipientPhoneNumber,
        w.Occasion,
        w.OccasionLabel,
        w.RecipientOccasionDate,
        w.Channel,
        w.Status,
        w.PriceLabel,
        w.SealedAtUtc,
        w.DeliveredAtUtc,
        w.OpenedAtUtc,
        w.CreatedAtUtc);
}
