namespace WishDem.Admin.Api.Models.Responses;

public record DashboardOverviewResponse(
    int TotalWishes,
    int SealedTodayCount,
    int OpenedTodayCount,
    int OpenModerationCasesCount,
    decimal TotalRevenue,
    int TotalCustomers,
    int CustomersWithWishCount);
