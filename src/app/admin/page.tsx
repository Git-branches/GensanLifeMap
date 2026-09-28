"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAdminOverview, type AdminOverview } from "@/lib/api/admin";
import { getFriendlyErrorMessage } from "@/lib/api/client";
import { useAuth } from "@/components/auth-provider";

function dateLabel(value: string) {
  return new Date(value).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminOverview().then(setOverview).catch((reason: unknown) => setError(getFriendlyErrorMessage(reason))).finally(() => setLoading(false));
  }, []);

  const metrics = overview ? [
    { label: "Locations", value: overview.locations, href: user?.role === "admin" ? "/admin/locations" : undefined },
    { label: "Projects", value: overview.projects, href: user?.role === "admin" ? "/admin/projects" : undefined },
    { label: "Facilities", value: overview.facilities, href: user?.role === "admin" ? "/admin/facilities" : undefined },
    { label: "Reports needing attention", value: overview.pending_reports, href: "/admin/community-reports" },
    { label: "Published announcements", value: overview.announcements, href: user?.role === "admin" ? "/admin/announcements" : undefined },
    ...(user?.role === "admin" ? [{ label: "Registered users", value: overview.registered_users, href: "/admin/users" }] : []),
  ] : [];

  return (
    <div className="mx-auto max-w-[1440px] lg:flex lg:h-full lg:min-h-0 lg:flex-col">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end"><div><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-blue-800"><span className="h-1.5 w-1.5 rounded-full bg-teal-500" />General Santos City</div><h1 className="mt-2 text-[28px] font-bold tracking-tight text-slate-900">Dashboard</h1><p className="mt-1 text-sm text-slate-600">A current overview of city information and staff follow-up.</p></div><Link href="/" className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-800 sm:self-auto">View public website <span aria-hidden="true">↗</span></Link></div>
      {error && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      <section aria-label="Current platform totals" className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">{loading ? Array.from({ length: user?.role === "admin" ? 6 : 5 }, (_, index) => <div key={index} className="h-[92px] animate-pulse rounded-xl bg-white ring-1 ring-slate-200" />) : metrics.map((metric) => { const content = <><span className="block text-[26px] font-bold tabular-nums tracking-tight text-slate-900">{metric.value ?? "—"}</span><span className="mt-1 block text-[11px] font-medium leading-4 text-slate-500">{metric.label}</span></>; return metric.href ? <Link key={metric.label} href={metric.href} className="group rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/90 transition hover:-translate-y-0.5 hover:ring-blue-300">{content}<span className="mt-2 block h-0.5 w-7 rounded-full bg-blue-600 transition-all group-hover:w-12" /></Link> : <div key={metric.label} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/90">{content}<span className="mt-2 block h-0.5 w-7 rounded-full bg-slate-200" /></div>; })}</section>
      <div className="mt-5 grid gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/90 xl:flex xl:min-h-0 xl:flex-col"><div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4"><div><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-teal-500"/><h2 className="text-sm font-bold text-slate-900">Community reports</h2></div><p className="mt-1 text-xs text-slate-500">Most recently submitted by residents.</p></div><Link href="/admin/community-reports" className="rounded-lg px-2.5 py-2 text-xs font-semibold text-blue-800 transition hover:bg-blue-50">Open queue <span aria-hidden="true">→</span></Link></div>{loading ? <p className="p-5 text-sm text-slate-500">Loading reports…</p> : !overview?.recent_reports.length ? <p className="p-5 text-sm text-slate-500">No community reports are recorded yet.</p> : <ul className="divide-y divide-slate-100 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">{overview.recent_reports.map((report) => <li key={report.id} className="flex flex-col justify-between gap-2 px-5 py-3.5 transition hover:bg-slate-50/70 sm:flex-row sm:items-center"><div className="min-w-0"><p className="truncate text-[13px] font-semibold text-slate-800">{report.title}</p><p className="mt-1 truncate text-[11px] text-slate-500">{report.user?.name ?? "Resident"} <span className="mx-1 text-slate-300">·</span>{report.location?.name ?? "Location unavailable"} <span className="mx-1 text-slate-300">·</span>{dateLabel(report.created_at)}</p></div><span className="w-fit shrink-0 rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold capitalize text-sky-800 ring-1 ring-inset ring-sky-100">{report.status.replaceAll("_", " ")}</span></li>)}</ul>}</section>
        {user?.role === "admin" && <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/90 xl:flex xl:min-h-0 xl:flex-col"><div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4"><div><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-600"/><h2 className="text-sm font-bold text-slate-900">Administrative activity</h2></div><p className="mt-1 text-xs text-slate-500">Recent audited changes.</p></div><Link href="/admin/audit-logs" className="rounded-lg px-2.5 py-2 text-xs font-semibold text-blue-800 transition hover:bg-blue-50">View audit trail <span aria-hidden="true">→</span></Link></div>{loading ? <p className="p-5 text-sm text-slate-500">Loading activity…</p> : !overview?.recent_activity.length ? <p className="p-5 text-sm text-slate-500">No administrative activity has been logged.</p> : <ul className="divide-y divide-slate-100 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">{overview.recent_activity.map((entry) => <li key={entry.id} className="px-5 py-3.5 transition hover:bg-slate-50/70"><p className="text-[13px] font-semibold capitalize text-slate-800">{entry.action.replaceAll("_", " ")} <span className="font-normal text-slate-400">on</span> {entry.entity_type.replaceAll("_", " ")}</p><p className="mt-1 text-[11px] text-slate-500">{entry.actor?.name ?? "System"} <span className="mx-1 text-slate-300">·</span>{dateLabel(entry.created_at)}</p></li>)}</ul>}</section>}
      </div>
    </div>
  );
}
