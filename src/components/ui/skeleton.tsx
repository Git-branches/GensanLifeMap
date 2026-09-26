/**
 * Skeleton loading placeholders for content that's being fetched.
 * Used across listing and detail pages to indicate loading state.
 */

import type { HTMLAttributes } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "card" | "circle" | "rect";
}

export function Skeleton({
  variant = "rect",
  className = "",
  ...props
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-zinc-200 dark:bg-zinc-800";

  const variantClasses = {
    text: "h-4 rounded",
    card: "h-48 rounded-xl",
    circle: "rounded-full",
    rect: "h-full w-full rounded-lg",
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`.trim()}
      {...props}
    />
  );
}

/** Skeleton for card listings */
export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <Skeleton variant="text" className="w-24" />
      <Skeleton variant="text" className="mt-2 h-5 w-3/4" />
      <Skeleton variant="text" className="mt-2 w-1/2" />
      <Skeleton variant="text" className="mt-3 h-16" />
      <Skeleton variant="text" className="mt-3 w-32" />
    </div>
  );
}

/** Skeleton for detail page header */
export function SkeletonDetailHeader() {
  return (
    <div>
      <Skeleton variant="text" className="w-32" />
      <Skeleton variant="text" className="mt-2 h-8 w-2/3" />
      <Skeleton variant="text" className="mt-2 w-48" />
    </div>
  );
}
