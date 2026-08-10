/**
 * Design tokens transcribed from DESIGN.md. This is the single source of
 * truth for the WishDem brand — apps should never hardcode these values.
 */
export const colors = {
  brandAccent: "#E6C87A",
  brandAccentTint: "#E6F4FE",
  brandBackground: "#FCFCFD",
  brandBackgroundWarm: "#F9F9FB",
  brandBg: "#1B111D",
  brandInk: "#241D24",
  brandPrimary: "#2A1629",
  brandSurface: "#F6F0E8",
  secondaryMoss: "#34443A",
  secondaryMulberry: "#4A203D",
  secondaryPeriwinkle: "#7D83F4",
  secondaryRose: "#D99AA9",
} as const;

/**
 * The two reactive roles that flip between dark and light mode — everything
 * else (paper, ink, plum, champagne, mulberry, rose, moss, periwinkle) is a
 * fixed brand constant that stays the same in both themes. See base.css for
 * how these become CSS custom properties, and tailwind-preset.js for how
 * `bg-midnight` / `text-porcelain` resolve to them.
 */
export const themes = {
  dark: {
    canvas: "#1B111D", // brand-bg — the app's page background in dark mode
    inkOnCanvas: "#F6F0E8", // default text/border color sitting directly on canvas
  },
  light: {
    canvas: "#F9F9FB", // brand-background-warm — the page background in light mode
    inkOnCanvas: "#241D24", // brand-ink — default text/border color on canvas
  },
} as const;

export const fonts = {
  display: '"Playfair Display", serif',
  ui: "Manrope, sans-serif",
} as const;

export const radius = {
  sm: "8px",
  md: "14px",
  lg: "22px",
  pill: "9999px",
} as const;

export const spacing = {
  none: "0px",
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  "2xl": "32px",
} as const;

export const shadows = {
  card: "0 12px 32px rgba(13,6,14,.24)",
  deep: "0 24px 64px rgba(10,4,11,.42)",
} as const;
