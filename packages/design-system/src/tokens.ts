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
