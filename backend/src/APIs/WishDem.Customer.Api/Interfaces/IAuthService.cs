using WishDem.Common.Sdk.Responses;
using WishDem.Customer.Api.Interfaces;
using WishDem.Customer.Api.Models.Responses;

namespace WishDem.Customer.Api.Interfaces;

public interface IAuthService
{
    Task<IApiResponse<OtpRequestedResponse>> RequestOtpAsync(string email, CancellationToken ct = default);

    Task<IApiResponse<AuthTokenResponse>> VerifyOtpAsync(string email, string code, string? name, CancellationToken ct = default);

    Task<IApiResponse<AuthTokenResponse>> SignInWithGoogleAsync(string idToken, CancellationToken ct = default);

    Task<IApiResponse<AuthTokenResponse>> RefreshAsync(string refreshToken, CancellationToken ct = default);

    Task<IApiResponse<bool>> LogoutAsync(string refreshToken, CancellationToken ct = default);
}
