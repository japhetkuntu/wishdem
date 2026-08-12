namespace WishDem.Customer.Api.Interfaces;

/// <summary>Birthday/Anniversary wishes only ever deliver once — nothing resends the same
/// message the following year, since it would no longer be the sender's current words. As
/// each wish's next annual occurrence approaches, this nudges the sender by email to write
/// a fresh one instead, rather than silently doing nothing.</summary>
public interface IRecurringWishReminderService
{
    /// <summary>Finds delivered recurring wishes whose next occurrence is coming up and
    /// haven't been reminded about yet this cycle, emails each sender, and records that the
    /// reminder went out. Returns how many reminders were sent this pass.</summary>
    Task<int> SendDueRemindersAsync(CancellationToken ct = default);
}
