namespace WishDem.Common.Sdk.Enums;

/// <summary>Turns an occasion into the short phrase used in outbound copy (emails, SMS) —
/// e.g. "the birthday wish you sent them" / "the thank-you wish you sent them". Kept in
/// one place so every sender (email, SMS, in-app) describes the same wish the same way.</summary>
public static class OccasionTypeExtensions
{
    public static string WishPhrase(this OccasionType occasion, string? occasionLabel) => occasion switch
    {
        OccasionType.Birthday => "birthday wish",
        OccasionType.Anniversary => "anniversary wish",
        OccasionType.Congratulations => "congratulations wish",
        OccasionType.ThankYou => "thank-you wish",
        OccasionType.JustBecause => "just-because wish",
        OccasionType.Other when !string.IsNullOrWhiteSpace(occasionLabel) => $"{occasionLabel.Trim()} wish",
        _ => "wish",
    };
}
