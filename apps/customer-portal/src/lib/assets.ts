/**
 * Reference imagery pulled from the WishDem design mockups
 * (Designs/*.html data-asset-id attributes). Centralised here so pages
 * reference one source instead of inlining CDN URLs.
 */
export const ASSETS = {
  homeHeroGift: {
    src: "/themes/home-hero.webp",
    alt: "A sealed plum envelope prepared as a future gift",
  },
  // Self-hosted rather than the original third-party CDN URLs: that host sends no
  // Access-Control-Allow-Origin header, so the crossOrigin="anonymous" <img> in
  // ShareableWishCard.tsx (needed for html-to-image's canvas capture) silently
  // failed to load — breaking the "download/share as image" feature for Velvet
  // Night, the default theme, in every environment.
  createThemeVelvet: {
    src: "/themes/velvet-create.jpg",
    alt: "Velvet Night reveal theme",
  },
  paymentSealedLetter: {
    src: "/themes/velvet-sealed.jpg",
    alt: "A sealed plum envelope",
  },
  scheduledGift: {
    src: "/themes/velvet-scheduled.jpg",
    alt: "A sealed future gift",
  },
  revealVelvetEnvelope: {
    src: "/themes/velvet-reveal.jpg",
    alt: "A sealed Velvet Night envelope",
  },
  themeGardenLetter: {
    src: "/themes/garden-letter.jpg",
    alt: "A botanical correspondence scene with a pressed-flower wax seal",
  },
  themeSundayMorning: {
    src: "/themes/sunday-morning.jpg",
    alt: "A quiet sunlit table with a sunburst envelope detail",
  },
  themeAfterglow: {
    src: "/themes/afterglow.jpg",
    alt: "A dusk horizon behind a champagne gold-edged envelope",
  },
} as const;
