/**
 * GenSan LifeMap button system.
 *
 * Variants: primary (blue pill CTA) · secondary (bordered pill) ·
 * ghost (subtle pill toggle) · link (blue text). One height scale,
 * one radius, one focus ring — reused by every page including the map.
 */

import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "link";
export type ButtonSize = "sm" | "md";

const BASE =
  "inline-flex items-center justify-center gap-1.5 font-medium transition-colors " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const SIZES: Record<ButtonSize, string> = {
  sm: "px-4 py-1.5 text-sm",
  md: "px-6 py-2.5 text-sm",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "rounded-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500",
  secondary:
    "rounded-full border border-zinc-300 text-zinc-700 hover:bg-zinc-100 " +
    "dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800",
  ghost:
    "rounded-full border border-zinc-300 px-4 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 " +
    "dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800",
  link: "text-blue-700 hover:underline dark:text-blue-400",
};

/** Class string for anchor-styled buttons (`<Link className={buttonClasses(...)}>`). */
export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra = "",
): string {
  if (variant === "link") return `${BASE} ${VARIANTS.link} ${extra}`.trim();
  if (variant === "ghost") return `${BASE} ${VARIANTS.ghost} ${extra}`.trim();
  return `${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${extra}`.trim();
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      {...rest}
    />
  );
}

/** Toggle-chip style for aria-pressed filter controls (map kind filters). */
export function toggleChipClasses(active: boolean): string {
  return (
    "rounded-full px-3 py-1.5 text-sm font-medium transition-colors " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 " +
    (active
      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700")
  );
}

/** Header navigation link: quiet text, filled pill only when active. */
export function navLinkClasses(active: boolean): string {
  return (
    "rounded-full px-3 py-1.5 text-sm font-medium transition-colors " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 " +
    (active
      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800")
  );
}
