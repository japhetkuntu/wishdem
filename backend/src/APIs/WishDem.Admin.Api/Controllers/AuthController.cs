using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WishDem.Admin.Api.Common;
using WishDem.Admin.Api.Interfaces;
using WishDem.Admin.Api.Models.Requests;

namespace WishDem.Admin.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var response = await authService.LoginAsync(request.Email, request.Password, ct);
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

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        var userId = ClaimsReader.GetUserId(User);
        var response = await authService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken ct)
    {
        var response = await authService.ForgotPasswordAsync(request.Email, ct);
        return StatusCode(response.Code, response);
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken ct)
    {
        var response = await authService.ResetPasswordAsync(request.Email, request.Code, request.NewPassword, ct);
        return StatusCode(response.Code, response);
    }
}
