using System.Text.RegularExpressions;
using WishDem.Common.Sdk.Enums;
using WishDem.Common.Sdk.Exceptions;
using WishDem.Common.Sdk.Responses;
using WishDem.Customer.Api.Interfaces;
using WishDem.Customer.Api.Models.Requests;
using WishDem.Customer.Api.Models.Responses;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Customer.Api.Services;

public partial class PaymentService(IRepository<Payment> payments, IRepository<Wish> wishes, ILogger<PaymentService> logger) : IPaymentService
{
    public async Task<IApiResponse<PaymentResponse>> InitiateAsync(Guid customerUserId, Guid wishId, InitiatePaymentRequest request, CancellationToken ct = default)
    {
        try
        {
            var wish = await GetOwnedWishAsync(customerUserId, wishId, ct);
            if (wish.Status != WishStatus.Draft)
                return ApiResponseFactory.Conflict<PaymentResponse>("This wish has already been sealed.");

            var payment = new Payment
            {
                WishId = wish.Id,
                PhoneNumber = request.PhoneNumber,
                Provider = request.Provider,
                Amount = ParseAmount(wish.PriceLabel),
                Status = PaymentStatus.Pending,
            };

            await payments.AddAsync(payment, ct);
            return ToResponse(payment).ToCreatedApiResponse("Payment initiated successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<PaymentResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[InitiateAsync] Failed to initiate payment for wish {WishId} for customer {CustomerUserId}", wishId, customerUserId);
            return ApiResponseFactory.InternalError<PaymentResponse>("Failed to initiate payment.");
        }
    }

    public async Task<IApiResponse<PaymentResponse>> GetLatestAsync(Guid customerUserId, Guid wishId, CancellationToken ct = default)
    {
        try
        {
            await GetOwnedWishAsync(customerUserId, wishId, ct);

            var wishPayments = await payments.FindManyAsync(p => p.WishId == wishId, ct);
            var latest = wishPayments.OrderByDescending(p => p.CreatedAtUtc).FirstOrDefault()
                ?? throw new NotFoundException("No payment has been initiated for this wish yet.");

            return ToResponse(latest).ToOkApiResponse("Payment retrieved successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<PaymentResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[GetLatestAsync] Failed to get latest payment for wish {WishId} for customer {CustomerUserId}", wishId, customerUserId);
            return ApiResponseFactory.InternalError<PaymentResponse>("Failed to retrieve payment.");
        }
    }

    public async Task<IApiResponse<PaymentResponse>> SimulateOutcomeAsync(Guid customerUserId, Guid wishId, Guid paymentId, SimulatePaymentOutcomeRequest request, CancellationToken ct = default)
    {
        try
        {
            var wish = await GetOwnedWishAsync(customerUserId, wishId, ct);

            var payment = await payments.GetByIdAsync(paymentId, ct)
                ?? throw new NotFoundException("That payment could not be found.");
            if (payment.WishId != wishId)
                throw new NotFoundException("That payment could not be found.");

            if (payment.Status != PaymentStatus.Pending)
                return ApiResponseFactory.Conflict<PaymentResponse>("This payment has already been resolved.");

            if (request.Succeed)
            {
                payment.Status = PaymentStatus.Succeeded;
                payment.SettledAtUtc = DateTime.UtcNow;

                wish.Status = WishStatus.Sealed;
                wish.SealedAtUtc = DateTime.UtcNow;
                await wishes.UpdateAsync(wish, ct);
            }
            else
            {
                payment.Status = PaymentStatus.Failed;
                payment.FailureReason = request.FailureReason ?? "The payment could not be completed.";
            }

            await payments.UpdateAsync(payment, ct);
            return ToResponse(payment).ToOkApiResponse("Payment outcome recorded successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<PaymentResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[SimulateOutcomeAsync] Failed to simulate payment outcome for payment {PaymentId} on wish {WishId}", paymentId, wishId);
            return ApiResponseFactory.InternalError<PaymentResponse>("Failed to record payment outcome.");
        }
    }

    private async Task<Wish> GetOwnedWishAsync(Guid customerUserId, Guid wishId, CancellationToken ct)
    {
        var wish = await wishes.GetByIdAsync(wishId, ct)
            ?? throw new NotFoundException("That wish could not be found.");

        if (wish.CustomerUserId != customerUserId)
            throw new NotFoundException("That wish could not be found.");

        return wish;
    }

    private static decimal ParseAmount(string priceLabel)
    {
        var digitsOnly = PriceDigitsRegex().Match(priceLabel).Value;
        return decimal.TryParse(digitsOnly, out var amount) ? amount : 1.49m;
    }

    [GeneratedRegex(@"[\d.]+")]
    private static partial Regex PriceDigitsRegex();

    private static PaymentResponse ToResponse(Payment p) => new(
        p.Id, p.WishId, p.PhoneNumber, p.Provider, p.Amount, p.Status, p.FailureReason, p.SettledAtUtc, p.CreatedAtUtc);
}
