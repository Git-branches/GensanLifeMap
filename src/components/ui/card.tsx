/**
 * GenSan LifeMap card + badge system. One border, one radius, one
 * padding, one title/metadata hierarchy for every content card
 * (locations, projects, facilities, announcements, data sources).
 */

import type { HTMLAttributes, ReactNode } from "react";

const CARD =
  "rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950";

/** Shared card class string for non-`article` wrappers (e.g. link cards). */
export const cardClasses = CARD;

export function Card({
  className = "",
  ...rest
}: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return <article className={`${CARD} ${className}`.trim()} {...rest} />;
}

/** Small uppercase eyebrow line used above card titles. */
export function CardEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
      {children}
    </p>
  );
}

export function CardTitle({
  children,
  as: Tag = "h3",
}: {
  children: ReactNode;
  /** Listing pages render cards directly under the H1, so use "h2" there. */
  as?: "h2" | "h3";
}) {
  return (
    <Tag className="mt-1 text-base font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
      {children}
    </Tag>
  );
}

/** Secondary identifying line (barangay, dates, source names). */
export function CardMeta({ children }: { children: ReactNode }) {
  return (
    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
      {children}
    </p>
  );
}

export function CardText({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 ${className}`.trim()}
    >
      {children}
    </p>
  );
}

type BadgeTone = "neutral" | "info" | "warning" | "success" | "accent";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral:
    "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700",
  info: "bg-blue-50 text-blue-800 ring-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-900",
  warning:
    "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-900",
  success:
    "bg-green-50 text-green-800 ring-green-200 dark:bg-green-950 dark:text-green-200 dark:ring-green-900",
  accent:
    "bg-purple-50 text-purple-800 ring-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:ring-purple-900",
};

/**
 * Rounded status/category chip. Category mapping: locations → info,
 * projects → success, facilities → warning, announcements → accent.
 */
export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/**
 * Deterministic badge tone for arbitrary API category strings
 * (announcement categories, project statuses, …).
 */
export function categoryTone(category: string | null | undefined): BadgeTone {
  const c = (category ?? "").toLowerCase();
  if (/(emerg|alert|risk|hazard|warning)/.test(c)) return "warning";
  if (/(project|update|service|health|complet|publish)/.test(c)) return "success";
  if (/(advis|notice|info|weather|official)/.test(c)) return "info";
  if (/(commun|general|event|program|clean)/.test(c)) return "accent";
  if (/(cancel|close|expire)/.test(c)) return "neutral";
  return "neutral";
}
