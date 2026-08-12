using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WishDem.Actors.Sdk.Configuration;
using WishDem.Common.Sdk.Enums;
using WishDem.Messaging.Sdk;
using WishDem.Messaging.Sdk.Abstractions;
using WishDem.Messaging.Sdk.Templates;
using WishDem.Postgres.Sdk.Delivery;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Actors.Sdk.Delivery;

/// <summary>The actual "does anything happen on the recipient's occasion date" logic for
/// one wish — moved out of the (now purely dispatching) WishDeliveryDispatchService so
/// DeliveryWorkerActor can run many of these concurrently instead of one at a time.</summary>
public class WishDeliveryProcessor(
    IRepository<Wish> wishes,
    IRepository<CustomerUser> customerUsers,
    ISmsSender smsSender,
    IEmailSender emailSender,
    IOptions<DeliverySettings> options,
    ILogger<WishDeliveryProcessor> logger) : IWishDeliveryProcessor
{
    // After this many failed attempts we stop retrying at the fast exponential-backoff
    // cadence and fall back to a slow daily check instead — a permanently bad number or
    // provider outage shouldn't hammer the SMS provider every few minutes forever, but a
    // schedule that's come due should never require a human to manually click retry just
    // because the provider was down or a queued backoff window was missed.
    private const int MaxDeliveryAttempts = WishDeliveryTiming.StruggledDeliveryAttempts;
    private static readonly TimeSpan SlowRetryInterval = TimeSpan.FromHours(24);

    private readonly DeliverySettings _settings = options.Value;

    public async Task<bool> DeliverAsync(Guid wishId, CancellationToken ct = default)
    {
        var wish = await wishes.GetByIdAsync(wishId, ct);
        if (wish is null || wish.DeliveredAtUtc != null)
            return true; // gone or already handled by another pass — nothing left to do.

        bool delivered;
        try
        {
            delivered = await TryDeliverAsync(wish, ct);
        }
        catch (Exception e)
        {
            // A bad send shouldn't be treated as a crash (that would just restart this
            // worker for no benefit) — fall through to the same backoff bookkeeping below.
            logger.LogError(e, "[DeliverAsync] Failed to deliver wish {WishId}", wishId);
            delivered = false;
        }

        if (delivered)
        {
            wish.DeliveredAtUtc = DateTime.UtcNow;
            wish.NextDeliveryAttemptAtUtc = null;
            // WishStatus.Delivered existed but nothing ever set it — the frontend's
            // "is this due yet" check is `wish.status !== "sealed"`, so without this the
            // seal button/reveal never appeared even long after the due date and a
            // successful send: Status stayed Sealed forever until MarkOpenedAsync jumped
            // it straight to Opened, which a recipient can only trigger by clicking a seal
            // button that never rendered in the first place.
            if (wish.Status == WishStatus.Sealed) wish.Status = WishStatus.Delivered;
            await wishes.UpdateAsync(wish, ct);
            return true;
        }

        wish.DeliveryAttemptCount++;
        if (wish.DeliveryAttemptCount >= MaxDeliveryAttempts)
        {
            // Past the fast-retry budget — slow down to once a day instead of giving up
            // outright, so a temporary provider outage or a stale phone number that later
            // gets fixed on the wish still delivers on its own, with nobody needing to press
            // a "retry" button. Only notify the sender the first time we cross this line —
            // every attempt after would otherwise re-send the same "we're still trying" email.
            wish.NextDeliveryAttemptAtUtc = DateTime.UtcNow.Add(SlowRetryInterval);
            if (wish.DeliveryAttemptCount == MaxDeliveryAttempts)
            {
                logger.LogCritical(
                    "[DeliverAsync] Wish {WishId} failed delivery {Attempts} times — slowing to a daily retry and notifying the sender.",
                    wishId, wish.DeliveryAttemptCount);
                await NotifySenderOfFailureAsync(wish, ct);
            }
        }
        else
        {
            var backoff = TimeSpan.FromMinutes(Math.Min(Math.Pow(2, wish.DeliveryAttemptCount), 60));
            wish.NextDeliveryAttemptAtUtc = DateTime.UtcNow.Add(backoff);
        }

        await wishes.UpdateAsync(wish, ct);
        return false;
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

                // No WhatsApp provider is wired up — WhatsApp-channel wishes are also sent
                // via SMS for now, deliberately, not silently dropped. See MessagingSdk
                // README/comments for why (compliance/ops tradeoffs of the WhatsApp options).
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

    // This SMS lands directly on the recipient's own phone — referring to them by name in
    // the third person ("X sent Y a wish") reads like a notification about someone else's
    // business, when it's actually addressed to them. Speaking to them directly ("sent
    // you") is the more natural, personal phrasing for a message they're the one reading.
    private static string BuildMessage(Wish wish, string link) =>
        $"Hi {wish.RecipientName}! {wish.FromName} sent you a {wish.Occasion.WishPhrase(wish.OccasionLabel)} on WishDem. Open it here: {link}";

    private async Task NotifySenderOfFailureAsync(Wish wish, CancellationToken ct)
    {
        try
        {
            var sender = await customerUsers.GetByIdAsync(wish.CustomerUserId, ct);
            if (sender is null || string.IsNullOrWhiteSpace(sender.Email)) return;

            var subject = $"We couldn't deliver your wish for {wish.RecipientName}";
            var textBody = $"We tried several times but couldn't deliver your {wish.Occasion.WishPhrase(wish.OccasionLabel)} for {wish.RecipientName} — the phone number on file may be incorrect. Sign in to WishDem to check it.";
            var dashboardUrl = $"{_settings.FrontendBaseUrl.TrimEnd('/')}/dashboard";
            var htmlBody = EmailTemplate.Shell(subject, $"""
                {EmailTemplate.Eyebrow("Delivery needs your attention")}
                <h1 style="margin:0 0 14px;font-family:Georgia,'Playfair Display',serif;font-size:28px;font-weight:700;color:#2A1629;line-height:1.15;">We couldn't reach {EmailTemplate.Encode(wish.RecipientName)}</h1>
                <p style="margin:0;">We tried several times to deliver this wish and it never went through — the phone number on file is the most common reason. Your message hasn't gone anywhere; it's still safely held on your dashboard.</p>
                {EmailTemplate.Button("Check the delivery details", dashboardUrl)}
                <p style="margin:0;font-size:12px;color:rgba(36,29,36,0.55);">Update the number or delivery method there and we'll try again.</p>
                """);

            await emailSender.SendAsync(sender.Email, subject, textBody, htmlBody, ct);
        }
        catch (Exception e)
        {
            logger.LogError(e, "[NotifySenderOfFailureAsync] Failed to notify sender for wish {WishId}", wish.Id);
        }
    }
}
