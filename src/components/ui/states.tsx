/**
 * Shared loading / empty / error states. One visual language for every
 * route: skeletons while fetching, a calm empty card with an optional
 * recovery action, and a friendly error card (never raw backend errors).
 */

import type { ReactNode } from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800 ${className}`}
    />
  );
}

/** Generic page skeleton: header bar + hero lines + card grid. */
export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div aria-label="Page loading">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-3 h-9 w-2/3" />
      <Skeleton className="mt-3 h-5 w-1/2" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <Skeleton key={i} className="h-32 !rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </p>
      {message && (
        <p className="mx-auto mt-1 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          {message}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
    >
      <p className="font-semibold">Something couldn&apos;t be loaded.</p>
      <p className="mt-1">{message}</p>
    </div>
  );
}
