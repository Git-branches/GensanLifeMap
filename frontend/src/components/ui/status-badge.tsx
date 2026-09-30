/**
 * Status badge component with semantic colors and optional icons.
 * Used for project status, announcement categories, facility types, etc.
 */

import type { ReactNode } from "react";
import { CheckIcon } from "./icons";

export type StatusVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

interface StatusBadgeProps {
  children: ReactNode;
  variant?: StatusVariant;
  icon?: ReactNode;
  className?: string;
}

const variantClasses: Record<StatusVariant, string> = {
  default:
    "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700",
  success:
    "bg-green-50 text-green-800 ring-green-200 dark:bg-green-950 dark:text-green-200 dark:ring-green-900",
  warning:
    "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-900",
  danger:
    "bg-red-50 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900",
  info: "bg-blue-50 text-blue-800 ring-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-900",
  neutral:
    "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-700",
};

export function StatusBadge({
  children,
  variant = "default",
  icon,
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${variantClasses[variant]} ${className}`.trim()}
    >
      {icon && <span className="inline-flex">{icon}</span>}
      {children}
    </span>
  );
}

/**
 * Determines the appropriate status variant based on project status or similar text.
 */
export function getStatusVariant(status: string | null | undefined): StatusVariant {
  const s = (status ?? "").toLowerCase();

  if (/(complet|finish|done|approved|active|publish)/.test(s)) return "success";
  if (/(progress|ongoing|pending|review)/.test(s)) return "info";
  if (/(delay|hold|pause|suspend|overdue)/.test(s)) return "warning";
  if (/(cancel|reject|fail|close|expire|emergency)/.test(s)) return "danger";
  if (/(plan|draft|propos|schedul)/.test(s)) return "neutral";

  return "default";
}

/**
 * Status badge specifically for project completion with automatic color coding.
 */
export function CompletionBadge({ percentage }: { percentage: number }) {
  const variant: StatusVariant =
    percentage >= 100
      ? "success"
      : percentage >= 75
      ? "info"
      : percentage >= 25
      ? "warning"
      : "danger";

  return (
    <StatusBadge variant={variant} icon={percentage >= 100 ? <CheckIcon /> : null}>
      {percentage}% Complete
    </StatusBadge>
  );
}
