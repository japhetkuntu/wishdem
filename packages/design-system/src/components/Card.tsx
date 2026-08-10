import type { HTMLAttributes } from "react";
import clsx from "clsx";

export type CardTone = "paper" | "panel" | "plum";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
}

const toneClasses: Record<CardTone, string> = {
  paper: "bg-paper text-ink shadow-card",
  panel: "bg-porcelain/[0.045] border border-porcelain/[0.14]",
  // Fixed cream text (not the reactive `porcelain` token) since this sits on
  // the always-dark `plum` fill regardless of which app theme is active.
  plum: "bg-plum text-[#F6F0E8] border border-champagne/30",
};

export function Card({ tone = "panel", className, ...props }: CardProps) {
  return (
    <div
      className={clsx("rounded-lg", toneClasses[tone], className)}
      {...props}
    />
  );
}
