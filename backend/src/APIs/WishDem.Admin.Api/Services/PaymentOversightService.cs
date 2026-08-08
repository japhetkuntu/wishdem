using WishDem.Admin.Api.Interfaces;
using WishDem.Admin.Api.Models.Requests;
using WishDem.Admin.Api.Models.Responses;
using WishDem.Common.Sdk.Enums;
using WishDem.Common.Sdk.Exceptions;
using WishDem.Common.Sdk.Responses;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Admin.Api.Services;

public class PaymentOversightService(
    IRepository<Payment> payments,
    IRepository<Wish> wishes,
    IRepository<CustomerUser> customerUsers,
    ILogger<PaymentOversightService> logger) : IPaymentOversightService
{
    public async Task<IApiResponse<PagedResult<AdminPaymentResponse>>> GetAllAsync(int pageIndex, int pageSize, PaymentStatus? status, CancellationToken ct = default)
    {
        try
        {
            var page = await payments.GetPagedAsync(
                pageIndex,
                pageSize,
                filter: status.HasValue ? p => p.Status == status.Value : null,
                orderBy: q => q.OrderByDescending(p => p.CreatedAtUtc),
                ct: ct);

            var wishIds = page.Items.Select(p => p.WishId).Distinct().ToList();
            var relatedWishes = await wishes.FindManyAsync(w => wishIds.Contains(w.Id), ct);
            var wishesById = relatedWishes.ToDictionary(w => w.Id);

            var customerIds = relatedWishes.Select(w => w.CustomerUserId).Distinct().ToList();
            var customers = await customerUsers.FindManyAsync(c => customerIds.Contains(c.Id), ct);
            var customersById = customers.ToDictionary(c => c.Id);

            var result = new PagedResult<AdminPaymentResponse>
            {
                Items = page.Items.Select(p => ToResponse(p, wishesById.GetValueOrDefault(p.WishId), customersById)).ToList(),
                PageIndex = page.PageIndex,
                PageSize = page.PageSize,
                TotalCount = page.TotalCount,
            };

            return result.ToOkApiResponse("Payments retrieved successfully.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[GetAllAsync] Failed to list payments");
            return ApiResponseFactory.InternalError<PagedResult<AdminPaymentResponse>>("Failed to retrieve payments.");
        }
    }

    public async Task<IApiResponse<AdminPaymentResponse>> GetByIdAsync(Guid paymentId, CancellationToken ct = default)
    {
        try
        {
            var payment = await GetPaymentAsync(paymentId, ct);
            var wish = await wishes.GetByIdAsync(payment.WishId, ct);
            var response = ToResponse(payment, wish, await BuildSingleCustomerLookupAsync(wish, ct));
            return response.ToOkApiResponse("Payment retrieved successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<AdminPaymentResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[GetByIdAsync] Failed to get payment {PaymentId}", paymentId);
            return ApiResponseFactory.InternalError<AdminPaymentResponse>("Failed to retrieve payment.");
        }
    }

    public async Task<IApiResponse<AdminPaymentResponse>> RefundAsync(Guid paymentId, RefundPaymentRequest request, CancellationToken ct = default)
    {
        try
        {
            var payment = await GetPaymentAsync(paymentId, ct);
            if (payment.Status != PaymentStatus.Succeeded)
                return ApiResponseFactory.Conflict<AdminPaymentResponse>("Only a successful payment can be refunded.");

            payment.Status = PaymentStatus.Reversed;
            payment.RefundAmount = request.Amount;
            payment.RefundReason = request.Reason;
            payment.RefundedAtUtc = DateTime.UtcNow;
            await payments.UpdateAsync(payment, ct);

            var wish = await wishes.GetByIdAsync(payment.WishId, ct);
            var response = ToResponse(payment, wish, await BuildSingleCustomerLookupAsync(wish, ct));
            return response.ToOkApiResponse("Payment refunded successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<AdminPaymentResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[RefundAsync] Failed to refund payment {PaymentId}", paymentId);
            return ApiResponseFactory.InternalError<AdminPaymentResponse>("Failed to refund payment.");
        }
    }

    private async Task<Dictionary<Guid, CustomerUser>> BuildSingleCustomerLookupAsync(Wish? wish, CancellationToken ct)
    {
        var lookup = new Dictionary<Guid, CustomerUser>();
        if (wish is null) return lookup;

        var customer = await customerUsers.GetByIdAsync(wish.CustomerUserId, ct);
        if (customer is not null) lookup[customer.Id] = customer;
        return lookup;
    }

    private async Task<Payment> GetPaymentAsync(Guid paymentId, CancellationToken ct) =>
        await payments.GetByIdAsync(paymentId, ct) ?? throw new NotFoundException("That payment could not be found.");

    private static AdminPaymentResponse ToResponse(Payment p, Wish? wish, IReadOnlyDictionary<Guid, CustomerUser> customersById)
    {
        var senderName = wish is not null && customersById.TryGetValue(wish.CustomerUserId, out var customer)
            ? customer.Name
            : "unknown";

        // A payment that settled but whose wish never got sealed (or vice versa) signals a
        // reconciliation problem worth an admin's attention.
        var mismatch = p.Status == PaymentStatus.Succeeded && wish?.Status == WishStatus.Draft;

        return new AdminPaymentResponse(
            p.Id,
            p.WishId,
            senderName,
            p.PhoneNumber,
            p.Provider,
            p.Amount,
            p.Status,
            p.FailureReason,
            mismatch,
            p.RefundAmount,
            p.RefundReason,
            p.RefundedAtUtc,
            p.SettledAtUtc,
            p.CreatedAtUtc);
    }
}
