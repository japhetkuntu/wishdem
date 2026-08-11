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
      keyframes: {
        "wd-seal-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.18)", opacity: "0.75" },
        },
        "wd-seal-ring": {
          "0%": { transform: "scale(0.85)", opacity: "0.55" },
          "80%, 100%": { transform: "scale(1.9)", opacity: "0" },
        },
        "wd-fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // The wish-reveal moment: seal cracks in half and the two shards fly
        // apart along the crack's own axis, rather than a generic fade/scale.
        "wd-crack-left": {
          "0%": { transform: "translate(0, 0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translate(-14px, 10px) rotate(-18deg)", opacity: "0" },
        },
        "wd-crack-right": {
          "0%": { transform: "translate(0, 0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translate(14px, 10px) rotate(18deg)", opacity: "0" },
        },
        "wd-crack-line-draw": {
          "0%": { strokeDashoffset: "42" },
          "100%": { strokeDashoffset: "0" },
        },
        // The letter itself rising into view after the seal breaks — a
        // bigger, slower lift than wd-fade-in so it reads as paper unfolding.
        "wd-reveal-rise": {
          "0%": { opacity: "0", transform: "translateY(18px) scale(.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "wd-shine-sweep": {
          "0%": { transform: "translateX(-130%) skewX(-20deg)" },
          "100%": { transform: "translateX(230%) skewX(-20deg)" },
        },
      },
      animation: {
        "wd-seal-pulse": "wd-seal-pulse 1.6s ease-in-out infinite",
        "wd-seal-ring": "wd-seal-ring 1.6s cubic-bezier(0.2,0.6,0.4,1) infinite",
        "wd-fade-in": "wd-fade-in .5s ease-out",
        "wd-crack-left": "wd-crack-left .6s cubic-bezier(.3,.6,.4,1) forwards",
        "wd-crack-right": "wd-crack-right .6s cubic-bezier(.3,.6,.4,1) forwards",
        "wd-crack-line-draw": "wd-crack-line-draw .3s ease-out forwards",
        "wd-reveal-rise": "wd-reveal-rise .7s cubic-bezier(.2,.7,.3,1) both",
        "wd-shine-sweep": "wd-shine-sweep 1.1s ease-in-out .15s 1",
      },
    },
  },
};
