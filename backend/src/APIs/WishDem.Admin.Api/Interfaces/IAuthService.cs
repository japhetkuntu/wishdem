using WishDem.Admin.Api.Models.Responses;
using WishDem.Common.Sdk.Responses;

namespace WishDem.Admin.Api.Interfaces;

public interface IAuthService
{
    Task<IApiResponse<AuthTokenResponse>> LoginAsync(string email, string password, CancellationToken ct = default);

    Task<IApiResponse<AuthTokenResponse>> RefreshAsync(string refreshToken, CancellationToken ct = default);

    Task<IApiResponse<bool>> LogoutAsync(string refreshToken, CancellationToken ct = default);

    Task<IApiResponse<bool>> ChangePasswordAsync(Guid adminUserId, string currentPassword, string newPassword, CancellationToken ct = default);

    Task<IApiResponse<PasswordResetRequestedResponse>> ForgotPasswordAsync(string email, CancellationToken ct = default);

    Task<IApiResponse<bool>> ResetPasswordAsync(string email, string code, string newPassword, CancellationToken ct = default);
}
