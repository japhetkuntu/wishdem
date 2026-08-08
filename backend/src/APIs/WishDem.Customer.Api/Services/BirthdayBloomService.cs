using WishDem.Common.Sdk.Enums;
using WishDem.Common.Sdk.Exceptions;
using WishDem.Common.Sdk.Responses;
using WishDem.Customer.Api.Interfaces;
using WishDem.Customer.Api.Models.Responses;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Customer.Api.Services;

public class BirthdayBloomService(
    IRepository<GroupWish> groupWishes,
    IRepository<GroupWishMemory> memories,
    IRepository<GroupWishInvitation> invitations,
    IRepository<CustomerUser> customerUsers,
    ILogger<BirthdayBloomService> logger) : IBirthdayBloomService
{
    public async Task<IApiResponse<BirthdayBloomResponse>> GetAsync(Guid groupWishId, CancellationToken ct = default)
    {
        try
        {
            var groupWish = await groupWishes.GetByIdAsync(groupWishId, ct)
                ?? throw new NotFoundException("That keepsake could not be found.");

            if (groupWish.Status == GroupWishStatus.Collecting)
                return ApiResponseFactory.Conflict<BirthdayBloomResponse>("This keepsake isn't ready to be opened yet.");

            var organizer = await customerUsers.GetByIdAsync(groupWish.OrganizerCustomerUserId, ct);
            var groupWishInvitations = await invitations.FindManyAsync(i => i.GroupWishId == groupWishId, ct);
            var invitationsById = groupWishInvitations.ToDictionary(i => i.Id);

            var sealedMemories = await memories.FindManyAsync(m => m.GroupWishId == groupWishId && m.IsSealed, ct);

            var result = new BirthdayBloomResponse(
                groupWish.Id,
                groupWish.RecipientName,
                groupWish.DeliveryDate,
                organizer?.Name ?? "A friend",
                groupWish.OrganizerNote,
                sealedMemories
                    .OrderBy(m => m.CreatedAtUtc)
                    .Select(m => GroupWishService.ToMemoryResponse(m, invitationsById.GetValueOrDefault(m.InvitationId), groupWish.NamesVisible))
                    .ToList());

            return result.ToOkApiResponse("Keepsake retrieved successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<BirthdayBloomResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[GetAsync] Failed to get keepsake for group wish {GroupWishId}", groupWishId);
            return ApiResponseFactory.InternalError<BirthdayBloomResponse>("Failed to retrieve keepsake.");
        }
    }
}
