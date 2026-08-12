using Microsoft.Extensions.Options;
using WishDem.Actors.Sdk.Configuration;
using WishDem.Customer.Api.Interfaces;

namespace WishDem.Customer.Api.Workers;

/// <summary>Polls for due sealed wishes and dispatches them — the core promise of the
/// product (wishes actually arrive on the recipient's occasion) has no other trigger.
/// Runs the actual dispatch logic in a fresh DI scope each pass since IRepository/DbContext
/// are scoped, but this hosted service itself is a singleton. Dispatch itself just hands
/// each due wish to the delivery actor pool and returns immediately — the workers deliver
/// concurrently in the background, not on this poll's timeline.</summary>
public class WishDeliveryBackgroundService(
    IServiceScopeFactory scopeFactory,
    IOptions<DeliverySettings> options,
    ILogger<WishDeliveryBackgroundService> logger) : BackgroundService
{
    private readonly DeliverySettings _settings = options.Value;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var interval = TimeSpan.FromSeconds(Math.Max(1, _settings.PollIntervalSeconds));

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var dispatchService = scope.ServiceProvider.GetRequiredService<IWishDeliveryDispatchService>();
                var dispatchedCount = await dispatchService.DispatchDueWishesAsync(stoppingToken);

                if (dispatchedCount > 0)
                    logger.LogInformation("[WishDeliveryBackgroundService] Handed off {Count} wish(es) to the delivery actor pool this pass.", dispatchedCount);

                // Same poll, same scope — recurring wishes never get redelivered (see
                // RecurringWishReminderService), so this is the only thing standing between
                // "sender never hears about next year's occasion" and an actual nudge.
                var reminderService = scope.ServiceProvider.GetRequiredService<IRecurringWishReminderService>();
                await reminderService.SendDueRemindersAsync(stoppingToken);
            }
            catch (Exception e)
            {
                // A bad pass shouldn't kill the worker forever — log and try again next tick.
                logger.LogError(e, "[WishDeliveryBackgroundService] Delivery pass failed");
            }

            try
            {
                await Task.Delay(interval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // Expected on shutdown.
            }
        }
    }
}
