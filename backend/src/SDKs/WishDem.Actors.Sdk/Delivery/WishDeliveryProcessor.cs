using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WishDem.Actors.Sdk.Configuration;
using WishDem.Common.Sdk.Enums;
using WishDem.Messaging.Sdk;
using WishDem.Messaging.Sdk.Abstractions;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Actors.Sdk.Delivery;

/// <summary>The actual "does anything happen on the recipient's birthday" logic for one
/// wish — moved out of the (now purely dispatching) WishDeliveryDispatchService so
/// DeliveryWorkerActor can run many of these concurrently instead of one at a time.</summary>
public class WishDeliveryProcessor(
    IRepository<Wish> wishes,
    ISmsSender smsSender,
    IOptions<DeliverySettings> options,
    ILogger<WishDeliveryProcessor> logger) : IWishDeliveryProcessor
{
    private readonly DeliverySettings _settings = options.Value;

    public async Task<bool> DeliverAsync(Guid wishId, CancellationToken ct = default)
    {
        var wish = await wishes.GetByIdAsync(wishId, ct);
        if (wish is null || wish.DeliveredAtUtc != null)
            return true; // gone or already handled by another pass — nothing left to do.

        try
        {
            if (!await TryDeliverAsync(wish, ct))
                return false;

            wish.DeliveredAtUtc = DateTime.UtcNow;
            await wishes.UpdateAsync(wish, ct);
            return true;
        }
        catch (Exception e)
        {
            // Left undelivered so the next poll retries it — a bad send shouldn't be
            // treated as a crash (that would just restart this worker for no benefit).
            logger.LogError(e, "[DeliverAsync] Failed to deliver wish {WishId}", wishId);
            return false;
        }
    }

    private async Task<bool> TryDeliverAsync(Wish wish, CancellationToken ct)
    {
        var link = $"{_settings.FrontendBaseUrl.TrimEnd('/')}/w/{wish.Id}";

        switch (wish.Channel)
        {
            case DeliveryChannel.Sms:
            case DeliveryChannel.WhatsApp:
                if (string.IsNullOrWhiteSpace(wish.RecipientPhoneNumber))
                {
                    // Sms/WhatsApp requires a phone number, enforced by validation on new
                    // wishes — but an older wish saved before that rule existed could still
                    // lack one. Log and leave it for an admin to notice/fix rather than
                    // silently marking it delivered when nothing was actually sent.
                    logger.LogWarning(
                        "[TryDeliverAsync] Wish {WishId} is due for {Channel} delivery but has no recipient phone number — skipping.",
                        wish.Id, wish.Channel);
                    return false;
                }

                // Arkesel (the configured SMS provider) has no WhatsApp product, so
                // WhatsApp-channel wishes are also sent via SMS for now — see MessagingSdk
                // README/comments. This is a deliberate, documented compromise, not a bug.
                var message = BuildMessage(wish, link);
                try
                {
                    await smsSender.SendAsync(wish.RecipientPhoneNumber, message, ct);
                    return true;
                }
                catch (MessagingException e)
                {
                    logger.LogError(e, "[TryDeliverAsync] SMS send failed for wish {WishId}", wish.Id);
                    return false;
                }

            case DeliveryChannel.Link:
            default:
                // The customer shares the link themselves — "delivery" just means the
                // link is now live/accessible.
                return true;
        }
    }

    private static string BuildMessage(Wish wish, string link) =>
        $"{wish.FromName} sent {wish.RecipientName} a birthday wish on WishDem! Open it here: {link}";
}
