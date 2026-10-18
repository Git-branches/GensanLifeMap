import { REPORT_STATUS_LABELS } from "@/components/account/report-status";
import type { CommunityReportEvent, CommunityReportStatus } from "@/types/community-report";

const NOTES: Record<CommunityReportStatus, string> = {
  submitted: "Your report was received.",
  under_review: "City staff are reviewing it.",
  verified: "The issue was confirmed.",
  resolved: "The issue was marked resolved.",
  rejected: "The report was not accepted.",
};

const DOT: Record<CommunityReportStatus, string> = {
  submitted: "bg-sky-500",
  under_review: "bg-amber-500",
  verified: "bg-amber-500",
  resolved: "bg-emerald-500",
  rejected: "bg-rose-500",
};

function stamp(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

/** Vertical history of a report; the latest step is emphasised. */
export default function ReportTimeline({ events }: { events: CommunityReportEvent[] }) {
  return (
    <ol aria-label="Report history" className="relative space-y-5 border-l border-slate-200 pl-6 dark:border-slate-700">
      {events.map((event, index) => {
        const latest = index === events.length - 1;
        return (
          <li key={`${event.status}-${index}`} className="relative">
            <span
              aria-hidden="true"
              className={`absolute -left-[1.9rem] top-1 h-3 w-3 rounded-full ring-4 ring-white dark:ring-slate-900 ${DOT[event.status]}`}
            />
            <p className={`text-sm ${latest ? "font-bold text-slate-900 dark:text-slate-100" : "font-semibold text-slate-700 dark:text-slate-300"}`}>
              {REPORT_STATUS_LABELS[event.status]}
              {latest && <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-800 dark:bg-blue-950 dark:text-blue-200">Current</span>}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{NOTES[event.status]}</p>
            {event.note && (
              <blockquote className="mt-2 rounded-lg border-l-4 border-blue-300 bg-blue-50 px-3 py-2 text-sm leading-5 text-slate-700 dark:border-blue-700 dark:bg-blue-950 dark:text-slate-200">
                {event.note}
              </blockquote>
            )}
            {(event.at || event.by) && (
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                {event.at && <time dateTime={event.at}>{stamp(event.at)}</time>}
                {event.at && event.by && " · "}
                {event.by && <span>by {event.by}</span>}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
