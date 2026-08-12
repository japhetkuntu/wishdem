using Microsoft.Extensions.Options;
using WishDem.Actors.Sdk.Configuration;
using WishDem.Common.Sdk.Enums;
using WishDem.Customer.Api.Interfaces;
using WishDem.Messaging.Sdk.Abstractions;
using WishDem.Messaging.Sdk.Templates;
using WishDem.Postgres.Sdk.Delivery;
using WishDem.Postgres.Sdk.Entities;
using WishDem.Postgres.Sdk.Repositories;

namespace WishDem.Customer.Api.Services;

public class RecurringWishReminderService(
    IRepository<Wish> wishes,
    IRepository<CustomerUser> customerUsers,
    IEmailSender emailSender,
    IOptions<DeliverySettings> options,
    ILogger<RecurringWishReminderService> logger) : IRecurringWishReminderService
{
    // How far ahead of the next occurrence to start nudging the sender — early enough that
    // "write something new" doesn't feel like a last-minute scramble.
    private static readonly TimeSpan ReminderWindow = TimeSpan.FromDays(7);

    // A reminder sent for the current cycle will always be well inside the 7-day window
    // above; one sent ~a year ago was for the previous cycle. This gap comfortably
    // separates the two without needing to store which specific year was reminded.
    private static readonly TimeSpan MinGapBetweenReminders = TimeSpan.FromDays(60);

    private readonly DeliverySettings _settings = options.Value;

    public async Task<int> SendDueRemindersAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var sent = 0;

        // Only wishes that have actually gone out once — a recurring wish still sitting in
        // Sealed hasn't had its first occurrence yet, so it's the normal dispatch flow's
        // job, not a "write something new" reminder.
        var candidates = await wishes.FindManyAsync(
            w => w.DeliveredAtUtc != null && (w.Occasion == OccasionType.Birthday || w.Occasion == OccasionType.Anniversary),
            ct);

        foreach (var wish in candidates)
        {
            var next = WishDeliveryTiming.NextRecurringOccurrenceUtc(wish, now);
            if (next is null || next.Value - now > ReminderWindow) continue;
            if (wish.LastRecurringReminderAtUtc is { } last && last > next.Value.Subtract(MinGapBetweenReminders)) continue;

            if (await SendReminderAsync(wish, next.Value, ct))
            {
                wish.LastRecurringReminderAtUtc = now;
                await wishes.UpdateAsync(wish, ct);
                sent++;
            }
        }

        if (sent > 0)
            logger.LogInformation("[SendDueRemindersAsync] Sent {Count} recurring-wish reminder(s).", sent);

        return sent;
    }

    private async Task<bool> SendReminderAsync(Wish wish, DateTime nextOccurrenceUtc, CancellationToken ct)
    {
        try
        {
            var sender = await customerUsers.GetByIdAsync(wish.CustomerUserId, ct);
            if (sender is null || string.IsNullOrWhiteSpace(sender.Email)) return false;

            var wishPhrase = wish.Occasion.WishPhrase(wish.OccasionLabel);
            var subject = $"{wish.RecipientName}'s {wishPhrase.Replace(" wish", "")} is coming up";
            var createUrl = $"{_settings.FrontendBaseUrl.TrimEnd('/')}/create/message";
            var textBody =
                $"{wish.RecipientName}'s {wishPhrase.Replace(" wish", "")} is coming up on {nextOccurrenceUtc:d MMMM}. " +
                $"The wish you sent last time has already been delivered — write a new one for this year at {createUrl}.";
            var htmlBody = EmailTemplate.Shell(subject, $"""
                {EmailTemplate.Eyebrow("Coming up again")}
                <h1 style="margin:0 0 14px;font-family:Georgia,'Playfair Display',serif;font-size:28px;font-weight:700;color:#2A1629;line-height:1.15;">{EmailTemplate.Encode(wish.RecipientName)}'s {EmailTemplate.Encode(wishPhrase.Replace(" wish", ""))} is coming up</h1>
                <p style="margin:0;">It's nearly {nextOccurrenceUtc:d MMMM} again. The wish you sent for last year's occasion has already been delivered, so we won't send it a second time — but a moment like this deserves new words, not a repeat.</p>
                {EmailTemplate.Button("Write this year's wish", createUrl)}
                <p style="margin:0;font-size:12px;color:rgba(36,29,36,0.55);">Nothing sends automatically — you're always the one who decides what {EmailTemplate.Encode(wish.RecipientName)} hears.</p>
                """);

            await emailSender.SendAsync(sender.Email, subject, textBody, htmlBody, ct);
            return true;
        }
        catch (Exception e)
        {
            logger.LogError(e, "[SendReminderAsync] Failed to send recurring-wish reminder for wish {WishId}", wish.Id);
            return false;
        }
    }
}
