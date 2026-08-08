using Microsoft.AspNetCore.Http;
using WishDem.Common.Sdk.Enums;
using WishDem.Common.Sdk.Exceptions;
using WishDem.Common.Sdk.Responses;
using WishDem.Customer.Api.Interfaces;
using WishDem.Customer.Api.Models.Requests;
using WishDem.Customer.Api.Models.Responses;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;
using WishDem.Storage.Sdk;

namespace WishDem.Customer.Api.Services;

public class WishService(IRepository<Wish> wishes, IStorageService storageService, ILogger<WishService> logger) : IWishService
{
    private const long MaxAttachmentBytes = 25 * 1024 * 1024;

    private static readonly Dictionary<string, AttachmentKind> ContentTypeKinds = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/gif"] = AttachmentKind.Gif,
        ["image/png"] = AttachmentKind.Image,
        ["image/jpeg"] = AttachmentKind.Image,
        ["image/webp"] = AttachmentKind.Image,
        ["video/mp4"] = AttachmentKind.Video,
        ["video/quicktime"] = AttachmentKind.Video,
        ["video/webm"] = AttachmentKind.Video,
        ["audio/mpeg"] = AttachmentKind.Voice,
        ["audio/mp4"] = AttachmentKind.Voice,
        ["audio/wav"] = AttachmentKind.Voice,
        ["audio/ogg"] = AttachmentKind.Voice,
        ["audio/webm"] = AttachmentKind.Voice,
    };
    public async Task<IApiResponse<PagedResult<WishResponse>>> GetMyWishesAsync(Guid customerUserId, int pageIndex, int pageSize, CancellationToken ct = default)
    {
        try
        {
            var page = await wishes.GetPagedAsync(
                pageIndex,
                pageSize,
                filter: w => w.CustomerUserId == customerUserId,
                orderBy: q => q.OrderByDescending(w => w.CreatedAtUtc),
                ct: ct);

            var result = new PagedResult<WishResponse>
            {
                Items = page.Items.Select(ToResponse).ToList(),
                PageIndex = page.PageIndex,
                PageSize = page.PageSize,
                TotalCount = page.TotalCount,
            };

            return result.ToOkApiResponse("Wishes retrieved successfully.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[GetMyWishesAsync] Failed to list wishes for customer {CustomerUserId}", customerUserId);
            return ApiResponseFactory.InternalError<PagedResult<WishResponse>>("Failed to retrieve wishes.");
        }
    }

    public async Task<IApiResponse<WishResponse>> GetByIdAsync(Guid customerUserId, Guid wishId, CancellationToken ct = default)
    {
        try
        {
            var wish = await GetOwnedAsync(customerUserId, wishId, ct);
            return ToResponse(wish).ToOkApiResponse("Wish retrieved successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<WishResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[GetByIdAsync] Failed to get wish {WishId} for customer {CustomerUserId}", wishId, customerUserId);
            return ApiResponseFactory.InternalError<WishResponse>("Failed to retrieve wish.");
        }
    }

    public async Task<IApiResponse<WishResponse>> CreateAsync(Guid customerUserId, SaveWishRequest request, CancellationToken ct = default)
    {
        try
        {
            var wish = new Wish
            {
                CustomerUserId = customerUserId,
                RecipientName = request.RecipientName,
                RecipientRelationship = request.RecipientRelationship,
                RecipientTimezone = request.RecipientTimezone,
            };
            ApplyRequest(wish, request);

            await wishes.AddAsync(wish, ct);
            return ToResponse(wish).ToCreatedApiResponse("Wish created successfully.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[CreateAsync] Failed to create wish for customer {CustomerUserId}", customerUserId);
            return ApiResponseFactory.InternalError<WishResponse>("Failed to create wish.");
        }
    }

    public async Task<IApiResponse<WishResponse>> UpdateAsync(Guid customerUserId, Guid wishId, SaveWishRequest request, CancellationToken ct = default)
    {
        try
        {
            var wish = await GetOwnedAsync(customerUserId, wishId, ct);
            if (wish.Status != WishStatus.Draft)
                return ApiResponseFactory.Conflict<WishResponse>("This wish has already been sealed and can no longer be edited.");

            ApplyRequest(wish, request);
            await wishes.UpdateAsync(wish, ct);
            return ToResponse(wish).ToOkApiResponse("Wish updated successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<WishResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[UpdateAsync] Failed to update wish {WishId} for customer {CustomerUserId}", wishId, customerUserId);
            return ApiResponseFactory.InternalError<WishResponse>("Failed to update wish.");
        }
    }

    public async Task<IApiResponse<WishResponse>> SealAsync(Guid customerUserId, Guid wishId, SealWishRequest request, CancellationToken ct = default)
    {
        try
        {
            var wish = await GetOwnedAsync(customerUserId, wishId, ct);
            if (wish.Status != WishStatus.Draft)
                return ApiResponseFactory.Conflict<WishResponse>("This wish has already been sealed.");

            wish.Status = WishStatus.Sealed;
            wish.SealedAtUtc = DateTime.UtcNow;
            await wishes.UpdateAsync(wish, ct);
            return ToResponse(wish).ToOkApiResponse("Wish sealed successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<WishResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[SealAsync] Failed to seal wish {WishId} for customer {CustomerUserId}", wishId, customerUserId);
            return ApiResponseFactory.InternalError<WishResponse>("Failed to seal wish.");
        }
    }

    public async Task<IApiResponse<bool>> DeleteAsync(Guid customerUserId, Guid wishId, CancellationToken ct = default)
    {
        try
        {
            var wish = await GetOwnedAsync(customerUserId, wishId, ct);
            await wishes.RemoveAsync(wish, ct);
            return true.ToOkApiResponse("Wish deleted successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<bool>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[DeleteAsync] Failed to delete wish {WishId} for customer {CustomerUserId}", wishId, customerUserId);
            return ApiResponseFactory.InternalError<bool>("Failed to delete wish.");
        }
    }

    public async Task<IApiResponse<WishResponse>> GetPublicAsync(Guid wishId, CancellationToken ct = default)
    {
        try
        {
            var wish = await wishes.GetByIdAsync(wishId, ct)
                ?? throw new NotFoundException("That wish could not be found.");

            if (wish.Status == WishStatus.Draft)
                throw new NotFoundException("That wish could not be found.");

            var response = ToResponse(wish);
            if (wish.Status != WishStatus.Opened)
            {
                // The whole point of the sealed-envelope ceremony is that the message stays
                // hidden until the recipient breaks the seal — if we returned it here, anyone
                // peeking at the network tab before clicking "open" could read it early.
                // MarkOpenedAsync (the actual "break the seal" call) returns the full content.
                response = response with { Message = string.Empty, AttachmentKind = null, AttachmentUrl = null, AttachmentDurationSeconds = null };
            }

            return response.ToOkApiResponse("Wish retrieved successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<WishResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[GetPublicAsync] Failed to get public wish {WishId}", wishId);
            return ApiResponseFactory.InternalError<WishResponse>("Failed to retrieve wish.");
        }
    }

    public async Task<IApiResponse<WishResponse>> MarkOpenedAsync(Guid wishId, CancellationToken ct = default)
    {
        try
        {
            var wish = await wishes.GetByIdAsync(wishId, ct)
                ?? throw new NotFoundException("That wish could not be found.");

            if (wish.Status == WishStatus.Draft)
                throw new NotFoundException("That wish could not be found.");

            if (wish.Status != WishStatus.Opened)
            {
                // No real delivery worker exists yet in this skeleton, so if the wish hasn't
                // been marked delivered yet, opening it also stamps delivery now.
                if (wish.DeliveredAtUtc is null)
                    wish.DeliveredAtUtc = DateTime.UtcNow;

                wish.Status = WishStatus.Opened;
                wish.OpenedAtUtc = DateTime.UtcNow;
                await wishes.UpdateAsync(wish, ct);
            }

            return ToResponse(wish).ToOkApiResponse("Wish marked as opened.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<WishResponse>(ex);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[MarkOpenedAsync] Failed to mark wish {WishId} as opened", wishId);
            return ApiResponseFactory.InternalError<WishResponse>("Failed to mark wish as opened.");
        }
    }

    public async Task<IApiResponse<AttachmentUploadResponse>> UploadAttachmentAsync(Guid customerUserId, Guid wishId, IFormFile file, CancellationToken ct = default)
    {
        try
        {
            await GetOwnedAsync(customerUserId, wishId, ct);

            if (file is null || file.Length == 0)
                return ApiResponseFactory.BadRequest<AttachmentUploadResponse>("Please choose a file to upload.");

            if (file.Length > MaxAttachmentBytes)
                return ApiResponseFactory.BadRequest<AttachmentUploadResponse>("That file is too large. The maximum size is 25MB.");

            if (!ContentTypeKinds.TryGetValue(file.ContentType, out var kind))
                return ApiResponseFactory.BadRequest<AttachmentUploadResponse>("That file type isn't supported.");

            var key = await storageService.UploadAsync(new UploadFileRequest
            {
                OpenContent = file.OpenReadStream,
                OriginalFileName = file.FileName,
                ContentType = file.ContentType,
                Folder = $"wishes/{wishId}",
            }, ct);

            var url = storageService.BuildPublicUrl(key);
            var response = new AttachmentUploadResponse(url, kind, DurationSeconds: null);
            return response.ToCreatedApiResponse("Attachment uploaded successfully.");
        }
        catch (WishDemException ex)
        {
            return ApiResponseFactory.FromException<AttachmentUploadResponse>(ex);
        }
        catch (StorageException ex)
        {
            logger.LogError(ex, "[UploadAttachmentAsync] Storage provider rejected upload for wish {WishId} for customer {CustomerUserId}", wishId, customerUserId);
            return ApiResponseFactory.InternalError<AttachmentUploadResponse>("Failed to upload attachment.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[UploadAttachmentAsync] Failed to upload attachment for wish {WishId} for customer {CustomerUserId}", wishId, customerUserId);
            return ApiResponseFactory.InternalError<AttachmentUploadResponse>("Failed to upload attachment.");
        }
    }

    private async Task<Wish> GetOwnedAsync(Guid customerUserId, Guid wishId, CancellationToken ct)
    {
        var wish = await wishes.GetByIdAsync(wishId, ct)
            ?? throw new NotFoundException("That wish could not be found.");

        if (wish.CustomerUserId != customerUserId)
            throw new NotFoundException("That wish could not be found.");

        return wish;
    }

    private static void ApplyRequest(Wish wish, SaveWishRequest request)
    {
        wish.FromName = request.FromName;
        wish.RecipientName = request.RecipientName;
        wish.RecipientRelationship = request.RecipientRelationship;
        wish.RecipientBirthday = request.RecipientBirthday;
        wish.DeliveryTime = request.DeliveryTime;
        wish.RecipientTimezone = request.RecipientTimezone;
        wish.RecipientPhoneNumber = request.RecipientPhoneNumber;
        wish.Message = request.Message;
        wish.AttachmentKind = request.AttachmentKind;
        wish.AttachmentUrl = request.AttachmentUrl;
        wish.AttachmentDurationSeconds = request.AttachmentDurationSeconds;
        wish.ThemeId = request.ThemeId;
        wish.Channel = request.Channel;
    }

    private static WishResponse ToResponse(Wish w) => new(
        w.Id,
        w.FromName,
        w.RecipientName,
        w.RecipientRelationship,
        w.RecipientBirthday,
        w.DeliveryTime,
        w.RecipientTimezone,
        w.RecipientPhoneNumber,
        w.Message,
        w.AttachmentKind,
        w.AttachmentUrl,
        w.AttachmentDurationSeconds,
        w.ThemeId,
        w.Channel,
        w.Status,
        w.PriceLabel,
        w.SealedAtUtc,
        w.DeliveredAtUtc,
        w.OpenedAtUtc,
        w.CreatedAtUtc);
}
