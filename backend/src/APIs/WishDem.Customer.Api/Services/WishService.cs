using Microsoft.AspNetCore.Http;
using WishDem.Cache.Sdk.Services;
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

public class WishService(
    IRepository<Wish> wishes,
    IStorageService storageService,
    ICacheService cache,
    ILogger<WishService> logger) : IWishService
{
    private const long MaxAttachmentBytes = 25 * 1024 * 1024;

    // Scarcity, not a technical limit: a free product with no cap invites spam/abuse of
    // the SMS/WhatsApp delivery pipeline. Measured in UTC calendar days for simplicity —
    // good enough for a soft daily cap, not trying to be precise per sender timezone.
    private const int MaxWishesPerDay = 3;

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
            var usedToday = await GetUsedTodayAsync(customerUserId, ct);
            if (usedToday >= MaxWishesPerDay)
            {
                return ApiResponseFactory.TooManyRequests<WishResponse>(
                    $"You've reached today's limit of {MaxWishesPerDay} wishes. Come back tomorrow to create more.");
            }

            var wish = new Wish
            {
                CustomerUserId = customerUserId,
                RecipientName = request.RecipientName,
                RecipientRelationship = request.RecipientRelationship,
                RecipientTimezone = request.RecipientTimezone,
            };
            ApplyRequest(wish, request);

            await wishes.AddAsync(wish, ct);

            // The cache key is guaranteed to exist by now (GetUsedTodayAsync just seeded it),
            // so this is a plain atomic bump — no read-then-write race with concurrent
            // creates the way re-counting from Postgres on every request would have.
            await cache.IncrementAsync(WishCountCacheKey(customerUserId), TimeUntilNextUtcMidnight());

            return ToResponse(wish).ToCreatedApiResponse("Wish created successfully.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[CreateAsync] Failed to create wish for customer {CustomerUserId}", customerUserId);
            return ApiResponseFactory.InternalError<WishResponse>("Failed to create wish.");
        }
    }

    // Generous relative to the daily-limit counter: a visitor might reasonably start a wish,
    // go find their inbox to check a code, and come back the next morning to finish signing up.
    private static readonly TimeSpan DraftTtl = TimeSpan.FromHours(48);

    private static string DraftCacheKey(Guid draftId) => $"customer:wish-draft:{draftId:D}";

    public async Task<IApiResponse<GuestDraftResponse>> CreateDraftAsync(SaveWishRequest request, CancellationToken ct = default)
    {
        try
        {
            var draftId = Guid.NewGuid();
            await cache.SetAsync(DraftCacheKey(draftId), request, DraftTtl);
            return new GuestDraftResponse(draftId).ToCreatedApiResponse("Draft saved.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[CreateDraftAsync] Failed to create guest wish draft");
            return ApiResponseFactory.InternalError<GuestDraftResponse>("Failed to save your progress.");
        }
    }

    public async Task<IApiResponse<GuestDraftResponse>> UpdateDraftAsync(Guid draftId, SaveWishRequest request, CancellationToken ct = default)
    {
        try
        {
            await cache.SetAsync(DraftCacheKey(draftId), request, DraftTtl);
            return new GuestDraftResponse(draftId).ToOkApiResponse("Draft saved.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[UpdateDraftAsync] Failed to update guest wish draft {DraftId}", draftId);
            return ApiResponseFactory.InternalError<GuestDraftResponse>("Failed to save your progress.");
        }
    }

    public async Task<IApiResponse<SaveWishRequest>> GetDraftAsync(Guid draftId, CancellationToken ct = default)
    {
        try
        {
            var draft = await cache.GetAsync<SaveWishRequest>(DraftCacheKey(draftId));
            if (draft is null)
                return ApiResponseFactory.NotFound<SaveWishRequest>("That draft could not be found or has expired.");

            return draft.ToOkApiResponse("Draft retrieved successfully.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[GetDraftAsync] Failed to get guest wish draft {DraftId}", draftId);
            return ApiResponseFactory.InternalError<SaveWishRequest>("Failed to retrieve your progress.");
        }
    }

    public async Task<IApiResponse<WishResponse>> ClaimDraftAsync(Guid customerUserId, Guid draftId, CancellationToken ct = default)
    {
        try
        {
            var draft = await cache.GetAsync<SaveWishRequest>(DraftCacheKey(draftId));
            if (draft is null)
                return ApiResponseFactory.NotFound<WishResponse>("That draft could not be found or has expired. Please start again.");

            var created = await CreateAsync(customerUserId, draft, ct);
            if (created.Code is 200 or 201)
                await cache.RemoveAsync(DraftCacheKey(draftId));

            return created;
        }
        catch (Exception e)
        {
            logger.LogError(e, "[ClaimDraftAsync] Failed to claim guest wish draft {DraftId} for customer {CustomerUserId}", draftId, customerUserId);
            return ApiResponseFactory.InternalError<WishResponse>("Failed to continue your wish. Please try again.");
        }
    }

    public async Task<IApiResponse<DailyWishLimitResponse>> GetDailyLimitAsync(Guid customerUserId, CancellationToken ct = default)
    {
        try
        {
            var usedToday = await GetUsedTodayAsync(customerUserId, ct);
            var response = new DailyWishLimitResponse(
                Used: usedToday,
                Max: MaxWishesPerDay,
                Remaining: Math.Max(0, MaxWishesPerDay - usedToday),
                ResetsAtUtc: DateTime.UtcNow.Date.AddDays(1));

            return response.ToOkApiResponse("Daily wish limit retrieved successfully.");
        }
        catch (Exception e)
        {
            logger.LogError(e, "[GetDailyLimitAsync] Failed to get daily wish limit for customer {CustomerUserId}", customerUserId);
            return ApiResponseFactory.InternalError<DailyWishLimitResponse>("Failed to retrieve daily wish limit.");
        }
    }

    /// <summary>Cache-aside read of "how many wishes has this customer created today" — the
    /// create wizard's first step calls GetDailyLimitAsync on every load, so without this
    /// every page view would otherwise be a Postgres COUNT query. Falls back to Postgres only
    /// on a cache miss (first check of the day, or after a Redis restart/eviction), then seeds
    /// the cache so every subsequent read/check for the rest of the day is Redis-only.</summary>
    private async Task<int> GetUsedTodayAsync(Guid customerUserId, CancellationToken ct)
    {
        var key = WishCountCacheKey(customerUserId);
        var cached = await cache.GetAsync<int?>(key);
        if (cached is not null) return cached.Value;

        var todayStartUtc = DateTime.UtcNow.Date;
        var createdToday = await wishes.FindManyAsync(
            w => w.CustomerUserId == customerUserId && w.CreatedAtUtc >= todayStartUtc,
            ct);
        var count = createdToday.Count;

        await cache.SetAsync(key, count, TimeUntilNextUtcMidnight());
        return count;
    }

    private static string WishCountCacheKey(Guid customerUserId) => $"customer:wish-count:{customerUserId:D}:{DateTime.UtcNow:yyyyMMdd}";

    // Naturally expires the counter at day rollover instead of tracking day boundaries
    // ourselves — tomorrow's first read/write just seeds a fresh key from scratch.
    private static TimeSpan TimeUntilNextUtcMidnight() => DateTime.UtcNow.Date.AddDays(1) - DateTime.UtcNow;

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
