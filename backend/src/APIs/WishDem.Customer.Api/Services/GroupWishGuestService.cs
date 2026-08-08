using WishDem.Common.Sdk.Enums;
using WishDem.Common.Sdk.Exceptions;
using WishDem.Common.Sdk.Responses;
using WishDem.Customer.Api.Interfaces;
using WishDem.Customer.Api.Models.Requests;
using WishDem.Customer.Api.Models.Responses;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Customer.Api.Services;

public class GroupWishGuestService(
    IRepository<GroupWishInvitation> invitations,
    IRepository<GroupWish> groupWishes,
    IRepository<GroupWishMemory> memories,
    IRepository<CustomerUser> customerUsers,
    ILogger<GroupWishGuestService> logger) : IGroupWishGuestService
{
    public async Task<IApiResponse<GroupWishInvitationContextResponse>> GetInvitationContextAsync(string inviteToken, CancellationToken ct = default)
    {
        try
        {
            var (invitation, groupWish) = await GetInvitationAsync(inviteToken, ct);
            return (await ToContextResponseAsync(invitation, groupWish, ct)).ToOkApiResponse("Invitation retrieved successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<GroupWishInvitationContextResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[GetInvitationContextAsync] Failed to get invitation context for token {InviteToken}", inviteToken);
            return ApiResponseFactory.InternalError<GroupWishInvitationContextResponse>("Failed to retrieve invitation.");
        }
    }

    public async Task<IApiResponse<GroupWishInvitationContextResponse>> RespondAsync(string inviteToken, RespondToInvitationRequest request, CancellationToken ct = default)
    {
        try
        {
            var (invitation, groupWish) = await GetInvitationAsync(inviteToken, ct);
            if (groupWish.Status != GroupWishStatus.Collecting)
                return ApiResponseFactory.Conflict<GroupWishInvitationContextResponse>("This group wish is no longer accepting responses.");

            invitation.Status = request.Status;
            invitation.RespondedAtUtc = DateTime.UtcNow;
            await invitations.UpdateAsync(invitation, ct);

            return (await ToContextResponseAsync(invitation, groupWish, ct)).ToOkApiResponse("Response recorded successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<GroupWishInvitationContextResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[RespondAsync] Failed to record response for token {InviteToken}", inviteToken);
            return ApiResponseFactory.InternalError<GroupWishInvitationContextResponse>("Failed to record your response.");
        }
    }

    public async Task<IApiResponse<GroupWishMemoryResponse>> SubmitMemoryAsync(string inviteToken, SaveMemoryRequest request, CancellationToken ct = default)
    {
        try
        {
            var (invitation, groupWish) = await GetInvitationAsync(inviteToken, ct);
            if (groupWish.Status != GroupWishStatus.Collecting)
                return ApiResponseFactory.Conflict<GroupWishMemoryResponse>("This group wish is no longer accepting contributions.");

            if (invitation.Status is not (GroupWishInvitationStatus.Joined or GroupWishInvitationStatus.Invited))
                return ApiResponseFactory.Conflict<GroupWishMemoryResponse>("You need to accept the invitation before contributing a memory.");

            var memory = new GroupWishMemory { GroupWishId = groupWish.Id, InvitationId = invitation.Id };
            ApplyRequest(memory, request);

            await memories.AddAsync(memory, ct);
            return GroupWishService.ToMemoryResponse(memory, invitation, groupWish.NamesVisible).ToCreatedApiResponse("Memory submitted successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<GroupWishMemoryResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[SubmitMemoryAsync] Failed to submit memory for token {InviteToken}", inviteToken);
            return ApiResponseFactory.InternalError<GroupWishMemoryResponse>("Failed to submit memory.");
        }
    }

    public async Task<IApiResponse<GroupWishMemoryResponse>> UpdateMemoryAsync(string inviteToken, Guid memoryId, SaveMemoryRequest request, CancellationToken ct = default)
    {
        try
        {
            var (invitation, groupWish) = await GetInvitationAsync(inviteToken, ct);
            var memory = await GetOwnedMemoryAsync(invitation, memoryId, ct);
            if (memory.IsSealed)
                return ApiResponseFactory.Conflict<GroupWishMemoryResponse>("This memory has already been sealed and can no longer be edited.");

            ApplyRequest(memory, request);
            await memories.UpdateAsync(memory, ct);
            return GroupWishService.ToMemoryResponse(memory, invitation, groupWish.NamesVisible).ToOkApiResponse("Memory updated successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<GroupWishMemoryResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[UpdateMemoryAsync] Failed to update memory {MemoryId} for token {InviteToken}", memoryId, inviteToken);
            return ApiResponseFactory.InternalError<GroupWishMemoryResponse>("Failed to update memory.");
        }
    }

    public async Task<IApiResponse<GroupWishMemoryResponse>> SealMemoryAsync(string inviteToken, Guid memoryId, CancellationToken ct = default)
    {
        try
        {
            var (invitation, groupWish) = await GetInvitationAsync(inviteToken, ct);
            var memory = await GetOwnedMemoryAsync(invitation, memoryId, ct);
            if (memory.IsSealed)
                return ApiResponseFactory.Conflict<GroupWishMemoryResponse>("This memory has already been sealed.");

            memory.IsSealed = true;
            await memories.UpdateAsync(memory, ct);
            return GroupWishService.ToMemoryResponse(memory, invitation, groupWish.NamesVisible).ToOkApiResponse("Memory sealed successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<GroupWishMemoryResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[SealMemoryAsync] Failed to seal memory {MemoryId} for token {InviteToken}", memoryId, inviteToken);
            return ApiResponseFactory.InternalError<GroupWishMemoryResponse>("Failed to seal memory.");
        }
    }

    private async Task<(GroupWishInvitation Invitation, GroupWish GroupWish)> GetInvitationAsync(string inviteToken, CancellationToken ct)
    {
        var invitation = await invitations.FindAsync(i => i.InviteToken == inviteToken, ct)
            ?? throw new NotFoundException("That invitation could not be found.");

        var groupWish = await groupWishes.GetByIdAsync(invitation.GroupWishId, ct)
            ?? throw new NotFoundException("That invitation could not be found.");

        return (invitation, groupWish);
    }

    private async Task<GroupWishMemory> GetOwnedMemoryAsync(GroupWishInvitation invitation, Guid memoryId, CancellationToken ct)
    {
        var memory = await memories.GetByIdAsync(memoryId, ct)
            ?? throw new NotFoundException("That memory could not be found.");

        if (memory.InvitationId != invitation.Id)
            throw new NotFoundException("That memory could not be found.");

        return memory;
    }

    private async Task<GroupWishInvitationContextResponse> ToContextResponseAsync(GroupWishInvitation invitation, GroupWish groupWish, CancellationToken ct)
    {
        var organizer = await customerUsers.GetByIdAsync(groupWish.OrganizerCustomerUserId, ct);

        return new GroupWishInvitationContextResponse(
            invitation.InviteToken,
            groupWish.Title,
            organizer?.Name ?? "A friend",
            groupWish.RecipientName,
            groupWish.Occasion,
            groupWish.DeliveryDate,
            groupWish.CollectByDate,
            FormatsCodec.Decode(groupWish.Formats),
            invitation.GuestName,
            invitation.Status,
            groupWish.OrganizerNote);
    }

    private static void ApplyRequest(GroupWishMemory memory, SaveMemoryRequest request)
    {
        memory.Format = request.Format;
        memory.Title = request.Title;
        memory.Body = request.Body;
        memory.WhenWhere = request.WhenWhere;
        memory.AttachmentUrl = request.AttachmentUrl;
        memory.AttachmentDurationSeconds = request.AttachmentDurationSeconds;
    }
}
