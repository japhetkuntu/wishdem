using WishDem.Admin.Api.Interfaces;
using WishDem.Admin.Api.Models.Responses;
using WishDem.Common.Sdk.Enums;
using WishDem.Common.Sdk.Exceptions;
using WishDem.Common.Sdk.Responses;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Admin.Api.Services;

public class CustomerProfileService(
    IRepository<CustomerUser> customerUsers,
    IRepository<Wish> wishes,
    IRepository<Payment> payments,
    ILogger<CustomerProfileService> logger) : ICustomerProfileService
{
    public async Task<IApiResponse<CustomerProfileResponse>> GetProfileAsync(Guid customerUserId, CancellationToken ct = default)
    {
        try
        {
            var customer = await customerUsers.GetByIdAsync(customerUserId, ct)
                ?? throw new NotFoundException("That customer could not be found.");

            var customerWishes = await wishes.FindManyAsync(w => w.CustomerUserId == customerUserId, ct);
            var wishCountByStatus = Enum.GetValues<WishStatus>()
                .ToDictionary(s => s, s => customerWishes.Count(w => w.Status == s));

            var wishIds = customerWishes.Select(w => w.Id).ToList();
            var relatedPayments = await payments.FindManyAsync(
                p => wishIds.Contains(p.WishId) && p.Status == PaymentStatus.Succeeded, ct);

            var totalAmountPaid = relatedPayments.Sum(p => p.Amount);

            var response = new CustomerProfileResponse(
                customer.Id,
                customer.Email,
                customer.Name,
                customer.CreatedAtUtc,
                customer.LastLoginAtUtc,
                customerWishes.Count,
                wishCountByStatus,
                totalAmountPaid);

            return response.ToOkApiResponse("Customer profile retrieved successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<CustomerProfileResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[GetProfileAsync] Failed to get customer profile {CustomerUserId}", customerUserId);
            return ApiResponseFactory.InternalError<CustomerProfileResponse>("Failed to retrieve customer profile.");
        }
    }
}
