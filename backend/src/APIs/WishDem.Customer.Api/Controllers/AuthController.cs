using Microsoft.AspNetCore.Mvc;
using WishDem.Customer.Api.Interfaces;
using WishDem.Customer.Api.Models.Requests;

namespace WishDem.Customer.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    /// <summary>Step 1 of passwordless sign-in: sends (or, in dev, echoes back) a six-digit code.</summary>
    [HttpPost("otp/request")]
    public async Task<IActionResult> RequestOtp([FromBody] RequestOtpRequest request, CancellationToken ct)
    {
        var response = await authService.RequestOtpAsync(request.Email, ct);
        return StatusCode(response.Code, response);
    }

    /// <summary>Step 2: verifying the code signs the customer in, creating their account
    /// on first use.</summary>
    [HttpPost("otp/verify")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request, CancellationToken ct)
    {
        var response = await authService.VerifyOtpAsync(request.Email, request.Code, request.Name, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPost("google")]
    public async Task<IActionResult> SignInWithGoogle([FromBody] GoogleSignInRequest request, CancellationToken ct)
    {
        var response = await authService.SignInWithGoogleAsync(request.IdToken, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request, CancellationToken ct)
    {
        var response = await authService.RefreshAsync(request.RefreshToken, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request, CancellationToken ct)
    {
        var response = await authService.LogoutAsync(request.RefreshToken, ct);
        return StatusCode(response.Code, response);
    }
}
