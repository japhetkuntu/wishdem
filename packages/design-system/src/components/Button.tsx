import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

export type ButtonVariant = "primary" | "ghost" | "outline" | "outline-inverse" | "dark";
export type ButtonSize = "md" | "sm";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-champagne text-plum shadow-[0_8px_18px_rgba(230,200,122,.15)] hover:brightness-105",
  ghost: "bg-transparent text-porcelain/90 hover:text-porcelain",
  outline:
    "bg-transparent text-porcelain border border-porcelain/30 hover:border-champagne hover:text-champagne",
  // For use on light/porcelain-surface panels, where the standard outline
  // (porcelain text) would be invisible.
  "outline-inverse":
    "bg-transparent text-plum border border-plum/30 hover:border-mulberry hover:text-mulberry",
  // Solid plum-on-porcelain — the primary action style for forms sitting
  // inside a porcelain card (e.g. auth flows), where champagne is reserved
  // for the marketing/CTA layer.
  dark: "bg-plum text-porcelain hover:brightness-125",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "min-h-[50px] px-5 text-[13px]",
  sm: "min-h-[43px] px-[17px] text-[11px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-pill font-extrabold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:brightness-100",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
