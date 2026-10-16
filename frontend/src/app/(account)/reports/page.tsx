"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import ReportTimeline from "@/components/account/report-timeline";
import { REPORT_STATUS_LABELS, ReportStatusPill } from "@/components/account/report-status";
import { useReports } from "@/components/account/reports-provider";
import { DocIcon } from "@/components/ui/icons";
import Modal from "@/components/ui/modal";
import { getFriendlyErrorMessage } from "@/lib/api";
import { getMyReport } from "@/lib/api/community-reports";
import type { CommunityReport, CommunityReportStatus } from "@/types/community-report";

const ReportMap = dynamic(() => import("@/components/lifemap/location-picker"), {
  ssr: false,
  loading: () => <div className="flex h-48 w-full items-center justify-center bg-slate-100 text-sm text-slate-500 dark:bg-slate-800">Loading map…</div>,
});

const CARD = "overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/90 dark:bg-slate-900 dark:ring-slate-800";

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

export default function MyReportsPage() {
  return <Suspense fallback={<p className="p-8 text-center text-sm text-slate-600">Loading your reports…</p>}><MyReportsContent /></Suspense>;
}

function MyReportsContent() {
  const searchParams = useSearchParams();
  const { reports, error: loadError, refresh, updatedIds, markSeen } = useReports();
  const [selected, setSelected] = useState<CommunityReport | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CommunityReportStatus | "all">("all");

  // Always show fresh data when arriving here (e.g. right after submitting).
  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function openReport(report: CommunityReport) {
    setDetailError(null);
    setSelected(report);
    markSeen(report);
    try {
      const detail = await getMyReport(report.id);
      setSelected(detail);
      markSeen(detail);
    } catch (reason) {
      setDetailError(getFriendlyErrorMessage(reason));
    }
  }

  const loading = reports === null;
  const list = reports ?? [];
  const visibleReports = list.filter((report) => {
    const search = query.trim().toLowerCase();
    const matchesSearch = !search || `${report.title} ${report.category} ${report.location?.name ?? ""} ${report.location?.barangay ?? ""}`.toLowerCase().includes(search);
    return matchesSearch && (statusFilter === "all" || report.status === statusFilter);
  });

  return (
    <>
      <div>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-800 dark:text-blue-300">Community</p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">My reports</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">Follow each issue you have sent to the city, from review to resolution.</p>
          </div>
          <Link href="/reports/new" className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-full bg-blue-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 sm:self-auto"><span aria-hidden="true" className="text-base leading-none">+</span>New report</Link>
        </div>

        {searchParams.get("submitted") === "1" && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200">Sent to the city. Its progress will show here.</p>}
        {loadError && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200">{loadError}</p>}

        <section aria-label="Submitted reports" className={`mt-5 ${CARD}`}>
          {!loading && list.length > 0 && (
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-[#f5f8fc] p-4 dark:border-slate-800 dark:bg-slate-900/70 sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search my reports</span>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by report, category, or location" className="min-h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-900" />
              </label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as CommunityReportStatus | "all")} aria-label="Filter reports by status" className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                <option value="all">All statuses</option>
                {Object.entries(REPORT_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          )}

          {loading ? (
            <div className="space-y-3 p-5">{[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}</div>
          ) : list.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <span aria-hidden="true" className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><DocIcon /></span>
              <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Nothing reported yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">Anything you send to the city appears here with its review status.</p>
              <Link href="/reports/new" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800">Report an issue</Link>
            </div>
          ) : visibleReports.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No reports match these filters. Try a different search or status.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {visibleReports.map((report) => (
                <li key={report.id}>
                  <button type="button" onClick={() => void openReport(report)} className="flex min-h-[76px] w-full items-center gap-4 px-4 py-3.5 text-left transition hover:bg-blue-50/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600 dark:hover:bg-slate-800/60 sm:px-5">
                    <span aria-hidden="true" className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:flex"><DocIcon /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{report.title}</span>
                      <span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">{report.category.replaceAll("_", " ")} <span className="mx-1 text-slate-300 dark:text-slate-600">·</span>{report.location?.name ?? "Location unavailable"}{report.location?.barangay ? `, ${report.location.barangay}` : ""}<span className="mx-1 text-slate-300 dark:text-slate-600">·</span>{dateLabel(report.created_at)}</span>
                    </span>
                    {updatedIds.has(report.id) && <span className="hidden shrink-0 rounded-full bg-blue-700 px-2 py-0.5 text-[11px] font-bold text-white sm:inline">New update</span>}
                    <ReportStatusPill status={report.status} />
                    <span aria-hidden="true" className="text-slate-400">›</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {selected && (
        <Modal label={`Report: ${selected.title}`} onClose={() => setSelected(null)} wide>
          <div className="px-1 pb-2 sm:px-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">{selected.category.replaceAll("_", " ")}</p>
              <ReportStatusPill status={selected.status} />
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold leading-snug text-zinc-900 dark:text-zinc-50">{selected.title}</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {selected.location?.name ?? "Location unavailable"}{selected.location?.barangay ? ` · ${selected.location.barangay}` : ""} · Submitted {dateLabel(selected.created_at)}
            </p>

            {selected.photo_url && (
              /* eslint-disable-next-line @next/next/no-img-element -- served by the API, not part of the optimised image set */
              <img src={selected.photo_url} alt="Photo attached to this report" className="mt-5 max-h-80 w-full rounded-xl border border-zinc-200 object-cover dark:border-zinc-700" />
            )}

            <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">{selected.description || "No additional description provided."}</p>

            {selected.latitude !== null && selected.longitude !== null && (
              <div className="mt-5">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Pinned location</h3>
                <div className="mt-2 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
                  <ReportMap value={{ lat: selected.latitude, lng: selected.longitude }} readOnly className="h-48 w-full" />
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-zinc-100 pt-5 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Progress</h3>
              <div className="mt-4">
                {selected.timeline ? (
                  <ReportTimeline events={selected.timeline} />
                ) : detailError ? (
                  <p role="alert" className="text-sm text-red-700 dark:text-red-300">{detailError}</p>
                ) : (
                  <div className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                )}
              </div>
              <p className="mt-5 text-xs text-zinc-500 dark:text-zinc-400">Last updated {dateLabel(selected.updated_at)}</p>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
