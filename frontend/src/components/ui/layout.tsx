/**
 * Shared layout primitives: one container width (max-w-6xl, px-4),
 * one page-header pattern (eyebrow → H1 → description), and evenly
 * spaced sections for every public page.
 */

import type { ReactNode } from "react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-4 ${className}`.trim()}>
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  onDark = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  /** Light-on-navy variant for use inside <PageBand>. */
  onDark?: boolean;
}) {
  return (
    <div>
      <p
        className={`text-xs font-bold uppercase tracking-widest ${
          onDark ? "text-amber-400" : "text-blue-700 dark:text-blue-400"
        }`}
      >
        {eyebrow}
      </p>
      <h1
        className={`mt-1 text-2xl font-bold tracking-tight sm:text-3xl ${
          onDark ? "text-white" : "text-zinc-900 dark:text-zinc-50"
        }`}
      >
        {title}
      </h1>
      {description && (
        <p
          className={`mt-2 max-w-2xl text-sm leading-relaxed sm:text-base ${
            onDark ? "text-blue-100" : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * Navy title band shared by every public inner page, echoing the
 * landing-page hero/"Why" band. Page content sits below on `sky-50`.
 */
export function PageBand({ children }: { children: ReactNode }) {
  return (
    <section className="bg-linear-to-br from-blue-950 to-blue-900">
      <Container className="py-10 sm:py-12">{children}</Container>
    </section>
  );
}

export function Section({
  id,
  title,
  description,
  action,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="py-10">
      <div className="flex items-center justify-between gap-3">
        <h2
          id={id}
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          {title}
        </h2>
        {action}
      </div>
      {description && (
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}
