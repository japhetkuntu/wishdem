import type { HTMLAttributes } from "react";
import clsx from "clsx";

export type BadgeTone = "accent" | "draft" | "attention" | "neutral";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, string> = {
  accent: "bg-champagne/[0.14] text-champagne",
  draft: "bg-rose/[0.17] text-rose",
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
