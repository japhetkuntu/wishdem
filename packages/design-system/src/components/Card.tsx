import type { HTMLAttributes } from "react";
import clsx from "clsx";

export type CardTone = "paper" | "panel" | "plum";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
}

const toneClasses: Record<CardTone, string> = {
  paper: "bg-porcelain text-ink shadow-card",
  panel: "bg-porcelain/[0.045] border border-porcelain/[0.14]",
  plum: "bg-plum text-porcelain border border-champagne/30",
};

export function Card({ tone = "panel", className, ...props }: CardProps) {
  return (
    <div
      className={clsx("rounded-lg", toneClasses[tone], className)}
      {...props}
    />
  );
}
