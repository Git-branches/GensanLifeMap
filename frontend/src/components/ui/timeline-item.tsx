/**
 * Timeline item component for displaying chronological information.
 * Used for announcements, project milestones, and event listings.
 */

import type { ReactNode } from "react";

interface TimelineItemProps {
  date: string;
  title: string;
  description?: string;
  badge?: ReactNode;
  icon?: ReactNode;
  isLast?: boolean;
  children?: ReactNode;
}

export function TimelineItem({
  date,
  title,
  description,
  badge,
  icon,
  isLast = false,
  children,
}: TimelineItemProps) {
  return (
    <div className="relative flex gap-4 pb-8">
      {/* Timeline line */}
      {!isLast && (
        <div
          className="absolute left-[15px] top-8 h-full w-0.5 bg-zinc-200 dark:bg-zinc-800"
          aria-hidden="true"
        />
      )}

      {/* Icon/dot */}
      <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center">
        {icon ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm ring-4 ring-white dark:ring-black">
            {icon}
          </div>
        ) : (
          <div className="h-3 w-3 rounded-full bg-blue-600 ring-4 ring-white dark:ring-black" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <time className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {date}
          </time>
          {badge}
        </div>
        <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        )}
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
}

/**
 * Timeline container for a list of timeline items.
 */
export function Timeline({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-0" role="list">
      {children}
    </div>
  );
}
