import type { OccasionType } from "@/types";

/** Mirrors the backend's OccasionTypeExtensions.WishPhrase — same phrase, same place,
 * so emails/SMS and the app itself always describe a wish the same way. */
export function occasionPhrase(occasion: OccasionType, occasionLabel?: string): string {
  switch (occasion) {
    case "birthday":
      return "birthday wish";
    case "anniversary":
      return "anniversary wish";
    case "congratulations":
      return "congratulations wish";
    case "thankYou":
      return "thank-you wish";
    case "justBecause":
      return "just-because wish";
    case "other":
      return occasionLabel?.trim() ? `${occasionLabel.trim()} wish` : "wish";
    default:
      return "wish";
  }
}
