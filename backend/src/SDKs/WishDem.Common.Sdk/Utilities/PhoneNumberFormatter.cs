using System.Text.RegularExpressions;

namespace WishDem.Common.Sdk.Utilities;

/// <summary>Normalizes Ghanaian phone numbers to E.164 (+233XXXXXXXXX) — the format the SMS
/// provider actually needs. Customers type numbers every way ("024 123 4567", "0244123456",
/// "+233244123456", "233244123456"), and a chunk of wishes were seeded/saved before any
/// normalization existed at all, so this needs to handle both new input and already-stored
/// legacy values, not just one or the other.</summary>
public static partial class PhoneNumberFormatter
{
    private const string CountryCode = "233";

    /// <summary>Returns the E.164 form of a Ghanaian mobile number, or the original,
    /// untouched input if it doesn't look like a Ghanaian number this can confidently
    /// normalize — never throws, never silently drops a value nobody asked it to touch.</summary>
    public static string? Normalize(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return raw;

        var digits = NonDigits().Replace(raw, "");

        // Local format: 0XXXXXXXXX (10 digits, leading 0) → +233XXXXXXXXX
        if (digits.Length == 10 && digits.StartsWith('0'))
            return $"+{CountryCode}{digits[1..]}";

        // Already has the country code but no leading '+' (or the '+' got stripped above).
        if (digits.Length == 12 && digits.StartsWith(CountryCode))
            return $"+{digits}";

        // Bare 9-digit subscriber number with neither the trunk '0' nor the country code.
        if (digits.Length == 9)
            return $"+{CountryCode}{digits}";

        // Doesn't match a recognized Ghanaian shape (wrong length, non-Ghana number, or
        // already malformed beyond what a formatter should guess at) — leave it as-is
        // rather than mangling something an admin needs to inspect by hand.
        return raw;
    }

    [GeneratedRegex(@"[^\d]")]
    private static partial Regex NonDigits();
}
