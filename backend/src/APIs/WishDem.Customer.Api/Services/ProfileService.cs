using WishDem.Common.Sdk.Exceptions;
using WishDem.Common.Sdk.Responses;
using WishDem.Customer.Api.Interfaces;
using WishDem.Customer.Api.Models.Requests;
using WishDem.Customer.Api.Models.Responses;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Customer.Api.Services;

public class ProfileService(IRepository<CustomerUser> customerUsers, ILogger<ProfileService> logger) : IProfileService
{
    public async Task<IApiResponse<ProfileResponse>> GetAsync(Guid customerUserId, CancellationToken ct = default)
    {
        try
        {
            var user = await customerUsers.GetByIdAsync(customerUserId, ct)
                ?? throw new NotFoundException("That profile could not be found.");

            return ToResponse(user).ToOkApiResponse("Profile retrieved successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<ProfileResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[GetAsync] Failed to get profile for customer {CustomerUserId}", customerUserId);
            return ApiResponseFactory.InternalError<ProfileResponse>("Failed to retrieve profile.");
        }
    }

    public async Task<IApiResponse<ProfileResponse>> UpdateAsync(Guid customerUserId, UpdateProfileRequest request, CancellationToken ct = default)
    {
        try
        {
            var user = await customerUsers.GetByIdAsync(customerUserId, ct)
                ?? throw new NotFoundException("That profile could not be found.");

            user.Name = request.Name;
            user.AvatarUrl = request.AvatarUrl;
            user.DateOfBirth = request.DateOfBirth;
            user.Country = request.Country;
            user.Region = request.Region;

            await customerUsers.UpdateAsync(user, ct);
            return ToResponse(user).ToOkApiResponse("Profile updated successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<ProfileResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[UpdateAsync] Failed to update profile for customer {CustomerUserId}", customerUserId);
            return ApiResponseFactory.InternalError<ProfileResponse>("Failed to update profile.");
        }
    }

    private static ProfileResponse ToResponse(CustomerUser u) => new(
        u.Id, u.Email, u.Name, u.AvatarUrl, u.DateOfBirth, u.Country, u.Region);
}
