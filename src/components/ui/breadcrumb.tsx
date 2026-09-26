/**
 * Breadcrumb navigation component for showing page hierarchy.
 * Used on detail pages and nested sections.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "./icons";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={
                    isLast
                      ? "font-medium text-zinc-900 dark:text-zinc-50"
                      : "text-zinc-600 dark:text-zinc-400"
                  }
                  {...(isLast ? { "aria-current": "page" } : {})}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span
                  aria-hidden="true"
                  className="text-zinc-400 dark:text-zinc-600"
                >
                  <ArrowRightIcon />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Section divider with optional title.
 * Used to visually separate major sections on a page.
 */
export function SectionDivider({
  title,
  className = "",
}: {
  title?: string;
  className?: string;
}) {
  if (title) {
    return (
      <div className={`relative ${className}`.trim()}>
        <div
          className="absolute inset-0 flex items-center"
          aria-hidden="true"
        >
          <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-zinc-50 px-3 font-medium text-zinc-500 dark:bg-black dark:text-zinc-400">
            {title}
          </span>
        </div>
      </div>
    );
  }

  return (
    <hr
      className={`border-zinc-200 dark:border-zinc-800 ${className}`.trim()}
    />
  );
}
