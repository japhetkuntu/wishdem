using Microsoft.AspNetCore.Mvc;
using WishDem.Customer.Api.Interfaces;

namespace WishDem.Customer.Api.Controllers;

/// <summary>Public: the recipient opens this link without needing an account of their own.</summary>
[ApiController]
[Route("api/birthday-bloom")]
public class BirthdayBloomController(IBirthdayBloomService birthdayBloomService) : ControllerBase
{
    [HttpGet("{groupWishId:guid}")]
    public async Task<IActionResult> Get(Guid groupWishId, CancellationToken ct)
    {
        var response = await birthdayBloomService.GetAsync(groupWishId, ct);
        return StatusCode(response.Code, response);
    }
}
