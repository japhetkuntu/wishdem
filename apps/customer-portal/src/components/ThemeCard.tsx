import type { ReactNode } from "react";
import clsx from "clsx";
import type { Theme, ThemeId } from "@/types";
import { ASSETS } from "@/lib/assets";

// Reference photography per theme. Themes without an entry fall back to
// their flat swatch colour until artwork exists.
const THEME_PREVIEW_IMAGES: Partial<Record<ThemeId, { src: string; alt: string }>> = {
  "velvet-night": ASSETS.createThemeVelvet,
  "garden-letter": ASSETS.themeGardenLetter,
  "sunday-morning": ASSETS.themeSundayMorning,
  afterglow: ASSETS.themeAfterglow,
};

export function ThemeCard({
  theme,
  selected,
  onSelect,
}: {
  theme: Theme;
  selected: boolean;
  onSelect: () => void;
}) {
  const image = THEME_PREVIEW_IMAGES[theme.id];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={clsx(
        "relative min-h-[145px] overflow-hidden rounded-lg border p-[14px] text-left transition-colors sm:min-h-[180px] sm:p-5",
        !image && theme.swatch,
        selected ? "border-champagne" : "border-porcelain/20",
      )}
    >
      {image && (
        <>
          <img
            src={image.src}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Scrim sits behind the title/description, which are top-anchored — darkens
              top-to-bottom so the text has real contrast regardless of how bright the
              underlying photo is. */}
          <div className="absolute inset-0 bg-gradient-to-b from-ink/75 via-ink/25 to-transparent" />
        </>
      )}
      <b
        className={clsx(
          "relative block font-display text-[22px] sm:text-[26px]",
          // Always light, fixed — this text sits on a photo, not the app canvas, so it must
          // not flip with light/dark theme the way reactive text-porcelain would.
          image && "text-[#F6F0E8]",
        )}
      >
        {theme.name}
      </b>
      <p
        className={clsx(
          "relative mt-1 max-w-[80%] text-[12px]",
          image ? "text-[#F6F0E8]/85" : "opacity-75",
        )}
      >
        {theme.description.split("·")[0]}
      </p>
      {!image && (
        <i
          aria-hidden
          className="absolute -right-4 bottom-4 h-[60px] w-[100px] rotate-[-8deg] rounded-md bg-paper sm:bottom-[17px]"
        />
      )}
    </button>
  );
}

export function ThemePreviewPanel({
  theme,
  footer,
}: {
  theme: Theme | undefined;
  footer?: ReactNode;
}) {
  if (!theme) {
    return (
      <aside className="rounded-lg bg-paper p-5 text-ink shadow-card sm:p-6">
        <span className="text-[10px] font-extrabold tracking-[0.14em] text-mulberry">
          CHOOSE A LOOK
        </span>
        <h2 className="my-3 font-display text-[26px] sm:text-[34px]">Pick a theme</h2>
        <p className="text-[13px] leading-[1.6]">
          Select one of the vessels on the left to see how the letter will arrive.
        </p>
        {footer}
      </aside>
    );
  }

  const previewImage = THEME_PREVIEW_IMAGES[theme.id];

  return (
    <aside className="rounded-lg bg-paper p-5 text-ink shadow-card sm:p-6">
      {previewImage && (
        <div className="relative mb-5 overflow-hidden rounded-md">
          <img
            src={previewImage.src}
            alt={previewImage.alt}
            loading="lazy"
            className="h-[200px] w-full object-cover sm:h-[270px]"
          />
          <span className="absolute bottom-[18px] left-[18px] rounded-pill bg-champagne px-3 py-2 text-[11px] font-extrabold text-plum">
            {theme.name}
          </span>
        </div>
      )}
      <span className="text-[10px] font-extrabold tracking-[0.14em] text-mulberry">
        SELECTED
      </span>
      <h2 className="my-3 font-display text-[26px] sm:text-[34px]">{theme.name}</h2>
      <p className="text-[13px] leading-[1.6]">{theme.description}</p>
      {footer}
    </aside>
  );
}
