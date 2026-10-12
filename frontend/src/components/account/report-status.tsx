import type { CommunityReportStatus } from "@/types/community-report";

export const REPORT_STATUS_LABELS: Record<CommunityReportStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  verified: "Verified",
  resolved: "Resolved",
  rejected: "Rejected",
};

const TONES: Record<CommunityReportStatus, string> = {
  submitted: "bg-sky-50 text-sky-800 ring-sky-100 dark:bg-sky-950 dark:text-sky-200 dark:ring-sky-900",
  under_review: "bg-amber-50 text-amber-800 ring-amber-100 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-900",
  verified: "bg-amber-50 text-amber-800 ring-amber-100 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-900",
  resolved: "bg-emerald-50 text-emerald-800 ring-emerald-100 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900",
  rejected: "bg-rose-50 text-rose-800 ring-rose-100 dark:bg-rose-950 dark:text-rose-200 dark:ring-rose-900",
};

/** Coloured status chip shared by the dashboard and the reports list. */
export function ReportStatusPill({ status }: { status: CommunityReportStatus }) {
  return (
    <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${TONES[status]}`}>
      {REPORT_STATUS_LABELS[status]}
    </span>
  );
}
