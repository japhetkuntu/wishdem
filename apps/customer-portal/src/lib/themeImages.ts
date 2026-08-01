import { ASSETS } from "@/lib/assets";
import type { ThemeId } from "@/types";

export type ThemeImageContext = "seal" | "scheduled" | "reveal";

// Velvet Night has bespoke photography per context (from the original
// mockups); other themes only have one photo each, reused across contexts.
const VELVET_IMAGES: Record<ThemeImageContext, { src: string; alt: string }> = {
  seal: ASSETS.paymentSealedLetter,
  scheduled: ASSETS.scheduledGift,
  reveal: ASSETS.revealVelvetEnvelope,
};

const THEME_IMAGES: Partial<Record<ThemeId, { src: string; alt: string }>> = {
  "garden-letter": ASSETS.themeGardenLetter,
  "sunday-morning": ASSETS.themeSundayMorning,
  afterglow: ASSETS.themeAfterglow,
};

/** Resolves the right vessel photo for a given theme + downstream context. */
export function getThemeImage(
  themeId: ThemeId | null | undefined,
  context: ThemeImageContext,
): { src: string; alt: string } {
  if (themeId) {
    const themeImage = THEME_IMAGES[themeId];
    if (themeImage) return themeImage;
  }
  return VELVET_IMAGES[context];
}
