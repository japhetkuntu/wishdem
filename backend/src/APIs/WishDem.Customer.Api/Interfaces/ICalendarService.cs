using WishDem.Common.Sdk.Responses;
using WishDem.Customer.Api.Models.Responses;

namespace WishDem.Customer.Api.Interfaces;

public interface ICalendarService
{
    Task<IApiResponse<IReadOnlyList<CalendarEventResponse>>> GetUpcomingAsync(
        Guid customerUserId, DateOnly from, DateOnly to, CancellationToken ct = default);
}
