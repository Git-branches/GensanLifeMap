"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { useAuth } from "@/components/auth-provider";
import { ScopedThemeProvider } from "@/components/theme-provider";
import { getFriendlyErrorMessage } from "@/lib/api";
import { getMyReport, getMyReports } from "@/lib/api/community-reports";
import type { CommunityReport, CommunityReportStatus } from "@/types/community-report";

const STATUS_LABELS: Record<CommunityReportStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  verified: "Verified",
  resolved: "Resolved",
  rejected: "Rejected",
};

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

export default function MyReportsPage() {
  return <ScopedThemeProvider scope="user"><Suspense fallback={<p className="p-8 text-center text-sm text-slate-600">Loading your reports…</p>}><MyReportsContent /></Suspense></ScopedThemeProvider>;
}

function MyReportsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useAuth();
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [selected, setSelected] = useState<CommunityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CommunityReportStatus | "all">("all");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?next=/reports");
    if (status !== "authenticated") return;
    getMyReports()
      .then((result) => setReports(result.data))
      .catch((reason: unknown) => setError(getFriendlyErrorMessage(reason)))
      .finally(() => setLoading(false));
  }, [status, router]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  async function openReport(id: number) {
    try {
      setSelected(await getMyReport(id));
    } catch (reason) {
      setError(getFriendlyErrorMessage(reason));
    }
  }

  const visibleReports = reports.filter((report) => {
    const search = query.trim().toLowerCase();
    const matchesSearch = !search || `${report.title} ${report.category} ${report.location?.name ?? ""} ${report.location?.barangay ?? ""}`.toLowerCase().includes(search);
    return matchesSearch && (statusFilter === "all" || report.status === statusFilter);
  });

  return (
    <div className="flex min-h-full flex-col bg-[#f3f7fb] font-sans text-slate-800 dark:bg-slate-950 dark:text-slate-200">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end dark:border-slate-800">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-blue-800 dark:text-blue-300"><span className="h-1.5 w-1.5 rounded-full bg-teal-500" aria-hidden="true" />General Santos City · Resident workspace</p>
            <h1 className="mt-2 text-[28px] font-bold tracking-tight text-slate-900 dark:text-slate-100">My community reports</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">Track the review progress of issues you have submitted to the city.</p>
          </div>
          <Link href="/reports/new" className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg bg-blue-700 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 sm:self-auto"><span className="text-base leading-none">+</span>Submit a report</Link>
        </div>

        {searchParams.get("submitted") === "1" && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200">Your report was submitted. You can follow its status here.</p>}
        {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200">{error}</p>}
        <section aria-label="Submitted reports" className="mt-5 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/90 dark:bg-slate-900 dark:ring-slate-800">
          {!loading && reports.length > 0 && <div className="flex flex-col gap-3 border-b border-slate-100 bg-[#f5f8fc] p-4 dark:border-slate-800 dark:bg-slate-900/70 sm:flex-row"><label className="relative min-w-0 flex-1"><span className="sr-only">Search my reports</span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by report, category, or location" className="min-h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-blue-900" /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as CommunityReportStatus | "all")} aria-label="Filter reports by status" className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"><option value="all">All statuses</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>}
          {loading ? <div className="space-y-3 p-5">{[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}</div> : reports.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6"><path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8l-5-5H8Z M14 3v6h7 M7 13h10 M7 17h7"/></svg></span>
              <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">No reports submitted yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">When you submit a community issue, its review status and latest update will appear here.</p>
              <Link href="/reports/new" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-blue-700 px-5 text-sm font-bold text-white hover:bg-blue-800">Create your first report</Link>
            </div>
          ) : visibleReports.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No reports match these filters. Try a different search or status.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {visibleReports.map((report) => (
                <li key={report.id}>
                  <button type="button" onClick={() => void openReport(report.id)} className="flex min-h-[76px] w-full items-center gap-4 px-4 py-3.5 text-left transition hover:bg-blue-50/60 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-blue-600 dark:hover:bg-slate-800/60 sm:px-5">
                    <span aria-hidden="true" className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:flex"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5"><path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8l-5-5H8Z M14 3v6h7 M7 13h10 M7 17h7"/></svg></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{report.title}</span><span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">{report.category.replaceAll("_", " ")} <span className="mx-1 text-slate-300 dark:text-slate-600">·</span>{report.location?.name ?? "Location unavailable"}{report.location?.barangay ? `, ${report.location.barangay}` : ""}<span className="mx-1 text-slate-300 dark:text-slate-600">·</span>{dateLabel(report.created_at)}</span></span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${report.status === "resolved" ? "bg-emerald-50 text-emerald-800 ring-emerald-100 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900" : report.status === "rejected" ? "bg-rose-50 text-rose-800 ring-rose-100 dark:bg-rose-950 dark:text-rose-200 dark:ring-rose-900" : report.status === "under_review" || report.status === "verified" ? "bg-amber-50 text-amber-800 ring-amber-100 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-900" : "bg-sky-50 text-sky-800 ring-sky-100 dark:bg-sky-950 dark:text-sky-200 dark:ring-sky-900"}`}>
                      {STATUS_LABELS[report.status]}
                    </span>
                    <span aria-hidden="true" className="text-slate-400">›</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <SiteFooter />

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-0 sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="report-detail-title" className="max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:max-w-xl sm:rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">{selected.category.replaceAll("_", " ")}</p><h2 id="report-detail-title" className="mt-2 text-xl font-bold text-slate-900">{selected.title}</h2></div>
              <button type="button" autoFocus onClick={() => setSelected(null)} className="rounded-full px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100" aria-label="Close report details">Close</button>
            </div>
            <dl className="mt-6 grid gap-4 border-y border-slate-100 py-5 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Status</dt><dd className="mt-1 font-semibold text-slate-900">{STATUS_LABELS[selected.status]}</dd></div>
              <div><dt className="text-slate-500">Date submitted</dt><dd className="mt-1 font-semibold text-slate-900">{dateLabel(selected.created_at)}</dd></div>
              <div className="sm:col-span-2"><dt className="text-slate-500">Location</dt><dd className="mt-1 font-semibold text-slate-900">{selected.location?.name ?? "Location unavailable"}{selected.location?.barangay ? ` · ${selected.location.barangay}` : ""}</dd></div>
            </dl>
            <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-slate-700">{selected.description || "No additional description provided."}</p>
            <p className="mt-5 text-xs text-slate-500">Last updated {dateLabel(selected.updated_at)}</p>
          </section>
        </div>
      )}
    </div>
  );
}
