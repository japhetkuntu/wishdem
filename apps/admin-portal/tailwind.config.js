import designSystemPreset from "@wishdem/design-system/tailwind-preset";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [designSystemPreset],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../packages/design-system/src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};
