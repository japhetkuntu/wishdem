using WishDem.Admin.Api.Interfaces;
using WishDem.Admin.Api.Models.Responses;
using WishDem.Common.Sdk.Enums;
using WishDem.Common.Sdk.Responses;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Admin.Api.Services;

/// <summary>Aggregates counts/sums across existing tables for a single at-a-glance
/// admin dashboard view — no new entities, purely a computed read.</summary>
public class DashboardService(
    IRepository<Wish> wishes,
    IRepository<Payment> payments,
    IRepository<ModerationCase> moderationCases,
    IRepository<CustomerUser> customerUsers,
    ILogger<DashboardService> logger) : IDashboardService
{
    public Task<IApiResponse<DashboardOverviewResponse>> GetOverviewAsync(CancellationToken ct = default)
    {
        try
        {
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            // GetQueryable() here is fine — it's used for in-service composition only, never
            // returned out of the service.
            var totalWishes = wishes.GetQueryable().Count();
            var sealedTodayCount = wishes.GetQueryable().Count(w => w.SealedAtUtc != null && w.SealedAtUtc >= today && w.SealedAtUtc < tomorrow);
            var openedTodayCount = wishes.GetQueryable().Count(w => w.OpenedAtUtc != null && w.OpenedAtUtc >= today && w.OpenedAtUtc < tomorrow);
            var openModerationCasesCount = moderationCases.GetQueryable().Count(c => c.Status == ModerationStatus.UnderReview);

            // A refunded payment's Status moves from Succeeded to Reversed, so it's already
            // excluded from this sum — there's nothing left to subtract for it. Don't also
            // subtract RefundAmount here, or a refunded payment nets to a negative amount
            // instead of zero.
            var totalRevenue = payments.GetQueryable().Where(p => p.Status == PaymentStatus.Succeeded).Sum(p => (decimal?)p.Amount) ?? 0m;

            var totalCustomers = customerUsers.GetQueryable().Count();

            var result = new DashboardOverviewResponse(
                totalWishes,
                sealedTodayCount,
                openedTodayCount,
                openModerationCasesCount,
                totalRevenue,
                totalCustomers);

            return Task.FromResult(result.ToOkApiResponse("Dashboard overview retrieved successfully."));
        }
        catch (Exception e)
        {
            logger.LogError(e, "[GetOverviewAsync] Failed to compute dashboard overview");
            return Task.FromResult(ApiResponseFactory.InternalError<DashboardOverviewResponse>("Failed to retrieve dashboard overview."));
        }
    }
}
