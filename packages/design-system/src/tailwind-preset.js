/** Tailwind theme extension shared across all WishDem apps. Keep in sync with tokens.ts / DESIGN.md. */
export default {
  theme: {
    extend: {
      colors: {
        midnight: "#1B111D", // brand-bg — dark atmospheric canvas
        plum: "#2A1629", // brand-primary — deep envelope/seal surfaces
        ink: "#241D24", // brand-ink — text on paper surfaces
        porcelain: "#F6F0E8", // brand-surface — warm paper
        champagne: "#E6C87A", // brand-accent — gold seal/accent
        mulberry: "#4A203D", // secondary-mulberry — borders, dividers, panels
        rose: "#D99AA9", // secondary-rose
        moss: "#34443A", // secondary-moss
        periwinkle: "#7D83F4", // secondary-periwinkle
        "accent-tint": "#E6F4FE",
        background: "#FCFCFD",
        "background-warm": "#F9F9FB",
      },
      fontFamily: {
        display: ['"Playfair Display"', "serif"],
        sans: ["Manrope", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "14px",
        lg: "22px",
        pill: "9999px",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
      },
      boxShadow: {
        card: "0 12px 32px rgba(13,6,14,.24)",
        deep: "0 24px 64px rgba(10,4,11,.42)",
      },
    },
  },
};
