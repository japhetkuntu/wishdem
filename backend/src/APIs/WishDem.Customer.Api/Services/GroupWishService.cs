using System.Security.Cryptography;
using WishDem.Common.Sdk.Enums;
using WishDem.Common.Sdk.Exceptions;
using WishDem.Common.Sdk.Responses;
using WishDem.Customer.Api.Interfaces;
using WishDem.Customer.Api.Models.Requests;
using WishDem.Customer.Api.Models.Responses;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Customer.Api.Services;

public class GroupWishService(
    IRepository<GroupWish> groupWishes,
    IRepository<GroupWishInvitation> invitations,
    IRepository<GroupWishMemory> memories,
    ILogger<GroupWishService> logger) : IGroupWishService
{
    public async Task<IApiResponse<IReadOnlyList<GroupWishResponse>>> GetMineAsync(Guid organizerId, CancellationToken ct = default)
    {
        try
        {
            var mine = await groupWishes.FindManyAsync(g => g.OrganizerCustomerUserId == organizerId, ct);
            var groupWishIds = mine.Select(g => g.Id).ToList();

            // Batch-load invitations/memories for every group wish in one round trip each,
            // instead of two queries per group wish (N+1) as the loop below used to do.
            var allInvitations = await invitations.FindManyAsync(i => groupWishIds.Contains(i.GroupWishId), ct);
            var allMemories = await memories.FindManyAsync(m => groupWishIds.Contains(m.GroupWishId), ct);
            var invitationsByGroupWish = allInvitations.GroupBy(i => i.GroupWishId).ToDictionary(g => g.Key, g => g.ToList());
            var memoriesCountByGroupWish = allMemories.GroupBy(m => m.GroupWishId).ToDictionary(g => g.Key, g => g.Count());

            IReadOnlyList<GroupWishResponse> result = mine
                .OrderByDescending(g => g.CreatedAtUtc)
                .Select(g => ToResponse(g, invitationsByGroupWish.GetValueOrDefault(g.Id, []), memoriesCountByGroupWish.GetValueOrDefault(g.Id)))
                .ToList();

            return result.ToOkApiResponse("Group wishes retrieved successfully.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[GetMineAsync] Failed to list group wishes for organizer {OrganizerId}", organizerId);
            return ApiResponseFactory.InternalError<IReadOnlyList<GroupWishResponse>>("Failed to retrieve group wishes.");
        }
    }

    public async Task<IApiResponse<GroupWishResponse>> GetByIdAsync(Guid organizerId, Guid groupWishId, CancellationToken ct = default)
    {
        try
        {
            var groupWish = await GetOwnedAsync(organizerId, groupWishId, ct);
            return (await ToResponseAsync(groupWish, ct)).ToOkApiResponse("Group wish retrieved successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<GroupWishResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[GetByIdAsync] Failed to get group wish {GroupWishId} for organizer {OrganizerId}", groupWishId, organizerId);
            return ApiResponseFactory.InternalError<GroupWishResponse>("Failed to retrieve group wish.");
        }
    }

    public async Task<IApiResponse<GroupWishResponse>> CreateAsync(Guid organizerId, CreateGroupWishRequest request, CancellationToken ct = default)
    {
        try
        {
            var groupWish = new GroupWish
            {
                OrganizerCustomerUserId = organizerId,
                Title = request.Title,
                RecipientName = request.RecipientName,
                Occasion = request.Occasion,
                DeliveryDate = request.DeliveryDate,
                CollectByDate = request.CollectByDate,
                Context = request.Context,
                OrganizerNote = request.OrganizerNote,
                Formats = FormatsCodec.Encode(request.Formats),
                NamesVisible = request.NamesVisible,
            };

            await groupWishes.AddAsync(groupWish, ct);
            return (await ToResponseAsync(groupWish, ct)).ToCreatedApiResponse("Group wish created successfully.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[CreateAsync] Failed to create group wish for organizer {OrganizerId}", organizerId);
            return ApiResponseFactory.InternalError<GroupWishResponse>("Failed to create group wish.");
        }
    }

    public async Task<IApiResponse<GroupWishInvitationResponse>> InviteAsync(Guid organizerId, Guid groupWishId, InviteGuestRequest request, CancellationToken ct = default)
    {
        try
        {
            var groupWish = await GetOwnedAsync(organizerId, groupWishId, ct);
            if (groupWish.Status != GroupWishStatus.Collecting)
                return ApiResponseFactory.Conflict<GroupWishInvitationResponse>("This group wish is no longer accepting new contributors.");

            var invitation = new GroupWishInvitation
            {
                GroupWishId = groupWish.Id,
                InviteToken = GenerateInviteToken(),
                GuestName = request.GuestName,
                GuestEmail = request.GuestEmail,
            };

            await invitations.AddAsync(invitation, ct);
            return ToInvitationResponse(invitation).ToCreatedApiResponse("Guest invited successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<GroupWishInvitationResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[InviteAsync] Failed to invite guest to group wish {GroupWishId} for organizer {OrganizerId}", groupWishId, organizerId);
            return ApiResponseFactory.InternalError<GroupWishInvitationResponse>("Failed to invite guest.");
        }
    }

    public async Task<IApiResponse<IReadOnlyList<GroupWishInvitationResponse>>> GetInvitationsAsync(Guid organizerId, Guid groupWishId, CancellationToken ct = default)
    {
        try
        {
            await GetOwnedAsync(organizerId, groupWishId, ct);
            var list = await invitations.FindManyAsync(i => i.GroupWishId == groupWishId, ct);
            IReadOnlyList<GroupWishInvitationResponse> result = list.OrderBy(i => i.CreatedAtUtc).Select(ToInvitationResponse).ToList();
            return result.ToOkApiResponse("Invitations retrieved successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<IReadOnlyList<GroupWishInvitationResponse>>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[GetInvitationsAsync] Failed to get invitations for group wish {GroupWishId} for organizer {OrganizerId}", groupWishId, organizerId);
            return ApiResponseFactory.InternalError<IReadOnlyList<GroupWishInvitationResponse>>("Failed to retrieve invitations.");
        }
    }

    public async Task<IApiResponse<IReadOnlyList<GroupWishMemoryResponse>>> GetMemoriesAsync(Guid organizerId, Guid groupWishId, CancellationToken ct = default)
    {
        try
        {
            var groupWish = await GetOwnedAsync(organizerId, groupWishId, ct);
            var groupWishMemories = await memories.FindManyAsync(m => m.GroupWishId == groupWishId, ct);
            var groupWishInvitations = await invitations.FindManyAsync(i => i.GroupWishId == groupWishId, ct);
            var invitationsById = groupWishInvitations.ToDictionary(i => i.Id);

            IReadOnlyList<GroupWishMemoryResponse> result = groupWishMemories
                .OrderBy(m => m.CreatedAtUtc)
                .Select(m => ToMemoryResponse(m, invitationsById.GetValueOrDefault(m.InvitationId), groupWish.NamesVisible))
                .ToList();

            return result.ToOkApiResponse("Memories retrieved successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<IReadOnlyList<GroupWishMemoryResponse>>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[GetMemoriesAsync] Failed to get memories for group wish {GroupWishId} for organizer {OrganizerId}", groupWishId, organizerId);
            return ApiResponseFactory.InternalError<IReadOnlyList<GroupWishMemoryResponse>>("Failed to retrieve memories.");
        }
    }

    public async Task<IApiResponse<GroupWishResponse>> SealAsync(Guid organizerId, Guid groupWishId, CancellationToken ct = default)
    {
        try
        {
            var groupWish = await GetOwnedAsync(organizerId, groupWishId, ct);
            if (groupWish.Status != GroupWishStatus.Collecting)
                return ApiResponseFactory.Conflict<GroupWishResponse>("This group wish has already been sealed.");

            groupWish.Status = GroupWishStatus.Sealed;
            groupWish.SealedAtUtc = DateTime.UtcNow;
            await groupWishes.UpdateAsync(groupWish, ct);
            return (await ToResponseAsync(groupWish, ct)).ToOkApiResponse("Group wish sealed successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<GroupWishResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[SealAsync] Failed to seal group wish {GroupWishId} for organizer {OrganizerId}", groupWishId, organizerId);
            return ApiResponseFactory.InternalError<GroupWishResponse>("Failed to seal group wish.");
        }
    }

    public async Task<IApiResponse<bool>> DeleteAsync(Guid organizerId, Guid groupWishId, CancellationToken ct = default)
    {
        try
        {
            var groupWish = await GetOwnedAsync(organizerId, groupWishId, ct);
            await groupWishes.RemoveAsync(groupWish, ct);
            return true.ToOkApiResponse("Group wish deleted successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<bool>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[DeleteAsync] Failed to delete group wish {GroupWishId} for organizer {OrganizerId}", groupWishId, organizerId);
            return ApiResponseFactory.InternalError<bool>("Failed to delete group wish.");
        }
    }

    private async Task<GroupWish> GetOwnedAsync(Guid organizerId, Guid groupWishId, CancellationToken ct)
    {
        var groupWish = await groupWishes.GetByIdAsync(groupWishId, ct)
            ?? throw new NotFoundException("That group wish could not be found.");

        if (groupWish.OrganizerCustomerUserId != organizerId)
            throw new NotFoundException("That group wish could not be found.");

        return groupWish;
    }

    private async Task<GroupWishResponse> ToResponseAsync(GroupWish g, CancellationToken ct)
    {
        var groupWishInvitations = await invitations.FindManyAsync(i => i.GroupWishId == g.Id, ct);
        var memoriesCount = await memories.FindManyAsync(m => m.GroupWishId == g.Id, ct);
        return ToResponse(g, groupWishInvitations, memoriesCount.Count);
    }

    private static GroupWishResponse ToResponse(GroupWish g, IReadOnlyList<GroupWishInvitation> groupWishInvitations, int memoriesCount) => new(
        g.Id,
        g.Title,
        g.RecipientName,
        g.Occasion,
        g.DeliveryDate,
        g.CollectByDate,
        g.Context,
        g.OrganizerNote,
        FormatsCodec.Decode(g.Formats),
        g.NamesVisible,
        g.Status,
        g.SealedAtUtc,
        g.DeliveredAtUtc,
        g.CreatedAtUtc,
        InvitedCount: groupWishInvitations.Count,
        JoinedCount: groupWishInvitations.Count(i => i.Status == GroupWishInvitationStatus.Joined),
        DeclinedCount: groupWishInvitations.Count(i => i.Status == GroupWishInvitationStatus.Declined),
        MemoriesCount: memoriesCount);

    private static GroupWishInvitationResponse ToInvitationResponse(GroupWishInvitation i) => new(
        i.Id, i.InviteToken, i.GuestName, i.GuestEmail, i.Status, i.RespondedAtUtc, i.CreatedAtUtc);

    internal static GroupWishMemoryResponse ToMemoryResponse(GroupWishMemory m, GroupWishInvitation? invitation, bool namesVisible) => new(
        m.Id,
        m.InvitationId,
        m.Format,
        m.Title,
        m.Body,
        m.WhenWhere,
        m.AttachmentUrl,
        m.AttachmentDurationSeconds,
        m.IsSealed,
        namesVisible ? invitation?.GuestName ?? "A friend" : "A friend",
        m.CreatedAtUtc,
        m.UpdatedAtUtc);

    private static string GenerateInviteToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(18))
        .Replace('+', '-').Replace('/', '_').TrimEnd('=');
}

internal static class FormatsCodec
{
    public static string Encode(List<MemoryFormat> formats) => string.Join(',', formats.Distinct());

    public static List<MemoryFormat> Decode(string formats) => formats
        .Split(',', StringSplitOptions.RemoveEmptyEntries)
        .Select(f => Enum.Parse<MemoryFormat>(f))
        .ToList();
}
