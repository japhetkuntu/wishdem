using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WishDem.Customer.Api.Common;
using WishDem.Customer.Api.Interfaces;

namespace WishDem.Customer.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/calendar")]
public class CalendarController(ICalendarService calendarService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetUpcoming(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        CancellationToken ct = default)
    {
        var userId = ClaimsReader.GetUserId(User);
        var rangeStart = from ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var rangeEnd = to ?? rangeStart.AddDays(90);

        var response = await calendarService.GetUpcomingAsync(userId, rangeStart, rangeEnd, ct);
        return StatusCode(response.Code, response);
    }
}
