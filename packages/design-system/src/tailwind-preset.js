/** Tailwind theme extension shared across all WishDem apps. Keep in sync with tokens.ts / DESIGN.md. */

// Lets a CSS-variable-backed color still support Tailwind's opacity modifiers
// (text-porcelain/70) — a bare `var(--x)` string silently breaks every /NN
// class since Tailwind can't inject an alpha channel into it. The variable
// itself must hold decomposed "R G B" channels (see base.css) for this to work.
function withOpacity(variableName) {
  return ({ opacityValue }) =>
    opacityValue === undefined ? `rgb(var(${variableName}))` : `rgb(var(${variableName}) / ${opacityValue})`;
}

export default {
  theme: {
    extend: {
      colors: {
        // Reactive — flip between dark/light mode via the CSS custom properties
        // defined in base.css ([data-theme="light"] overrides the :root default).
        // `midnight` is the page canvas; `porcelain`, used as text/border, is the
        // default readable-on-canvas color. Do NOT use `bg-porcelain` for a solid
        // fill that must always stay light paper — use `paper` for that instead.
        midnight: withOpacity("--wd-canvas-rgb"),
        porcelain: withOpacity("--wd-ink-on-canvas-rgb"),

        // Fixed brand constants — identical in both themes.
        paper: "#F6F0E8", // brand-surface — the letter/paper surface, always light
        plum: "#2A1629", // brand-primary — deep envelope/seal surfaces
        ink: "#241D24", // brand-ink — text on paper surfaces (paper is always light)
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
