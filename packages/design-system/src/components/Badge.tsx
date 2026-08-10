import type { HTMLAttributes } from "react";
import clsx from "clsx";

export type BadgeTone = "accent" | "draft" | "attention" | "neutral";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, string> = {
  // Solid fixed-dark chips, not a translucent tint of the same fixed hue —
  // a self-tint only reads well against a dark canvas; a badge that has to
  // work in both light and dark mode needs its own always-dark background.
  accent: "bg-plum text-champagne",
  draft: "bg-plum text-rose",
  // These two use the reactive `porcelain` token for both fill and text, so
  // they invert together and stay legible on whichever canvas is active.
  attention: "bg-porcelain/[0.12] text-porcelain",
  neutral: "border border-porcelain/25 text-porcelain/80",
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-pill px-[7px] py-[4px] text-[9px] font-extrabold leading-none tracking-[0.06em]",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
