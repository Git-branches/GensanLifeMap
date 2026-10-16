"use client";

/**
 * Resident dashboard: the landing screen after sign-in. A quick read of
 * the resident's own community reports plus shortcuts and the latest
 * public announcements. All data is the resident's own (or public).
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ReportStatusPill } from "@/components/account/report-status";
import { useReports } from "@/components/account/reports-provider";
import { useAuth } from "@/components/auth-provider";
import { ArrowRightIcon, DocIcon, FlagIcon, MapIcon, UsersIcon } from "@/components/ui/icons";
import { getAnnouncements } from "@/lib/api";
import type { Announcement } from "@/types";

const CARD = "overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/90 dark:bg-slate-900 dark:ring-slate-800";

function dateLabel(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { reports, error, refresh, updatedIds } = useReports();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    getAnnouncements({ per_page: 3 })
      .then((result) => { if (!cancelled) setAnnouncements(result.data); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    const list = reports ?? [];
    return {
      total: list.length,
      inProgress: list.filter((r) => r.status === "submitted" || r.status === "under_review" || r.status === "verified").length,
      resolved: list.filter((r) => r.status === "resolved").length,
      rejected: list.filter((r) => r.status === "rejected").length,
    };
  }, [reports]);

  const recent = useMemo(
    () => [...(reports ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5),
    [reports],
  );

  const firstName = user?.name.trim().split(/\s+/)[0] ?? "";
  const loading = reports === null;

  const tiles = [
    { label: "Total reports", value: stats.total, bar: "bg-blue-600" },
    { label: "In progress", value: stats.inProgress, bar: "bg-amber-500" },
    { label: "Resolved", value: stats.resolved, bar: "bg-emerald-500" },
    { label: "Not accepted", value: stats.rejected, bar: "bg-rose-500" },
  ];

  const shortcuts = [
    { href: "/reports/new", label: "Report an issue", text: "Tell the city about a problem", icon: <FlagIcon /> },
    { href: "/reports", label: "My reports", text: "Follow review progress", icon: <DocIcon /> },
    { href: "/lifemap", label: "Explore the map", text: "Places, projects, facilities", icon: <MapIcon /> },
    { href: "/profile", label: "Profile", text: "Name, email and password", icon: <UsersIcon /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-800 dark:text-blue-300">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-teal-500" />
          General Santos City · Resident workspace
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          {greeting()}{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Where your reports stand, and what is new in the city.
        </p>
      </div>

      {updatedIds.size > 0 && (
        <Link href="/reports" className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 transition-colors hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
          <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">{updatedIds.size}</span>
          <span className="min-w-0 flex-1 font-medium">
            {updatedIds.size === 1 ? "One of your reports has a new update." : `${updatedIds.size} of your reports have new updates.`}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold">View <ArrowRightIcon /></span>
        </Link>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{error}</p>
      )}

      <section aria-label="Report summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className={`${CARD} p-5`}>
            <span className="block text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
              {loading ? <span className="inline-block h-8 w-10 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /> : tile.value}
            </span>
            <span className="mt-1 block text-sm font-medium text-slate-600 dark:text-slate-400">{tile.label}</span>
            <span aria-hidden="true" className={`mt-3 block h-0.5 w-8 rounded-full ${tile.bar}`} />
          </div>
        ))}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
        <section aria-labelledby="recent-reports" className={CARD}>
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h2 id="recent-reports" className="text-base font-bold text-slate-900 dark:text-slate-100">Recent reports</h2>
            {recent.length > 0 && (
              <Link href="/reports" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-800 hover:underline dark:text-blue-300">
                View all <ArrowRightIcon />
              </Link>
            )}
          </div>
          {loading ? (
            <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}</div>
          ) : recent.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <span aria-hidden="true" className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><DocIcon /></span>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">Nothing reported yet</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-400">See something that needs attention? Tell the city and follow the review here.</p>
              <Link href="/reports/new" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800">
                <FlagIcon /> Report an issue
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recent.map((report) => (
                <li key={report.id}>
                  <Link href="/reports" className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-blue-50/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-700 dark:hover:bg-slate-800/60">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{report.title}</span>
                      <span className="mt-0.5 block truncate text-xs capitalize text-slate-500 dark:text-slate-400">
                        {report.category.replaceAll("_", " ")} · {report.location?.name ?? "Location unavailable"} · {dateLabel(report.created_at)}
                      </span>
                    </span>
                    {updatedIds.has(report.id) && <span className="hidden shrink-0 rounded-full bg-blue-700 px-2 py-0.5 text-[11px] font-bold text-white sm:inline">New update</span>}
                    <ReportStatusPill status={report.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <section aria-labelledby="shortcuts" className={CARD}>
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h2 id="shortcuts" className="text-base font-bold text-slate-900 dark:text-slate-100">Shortcuts</h2>
            </div>
            <ul className="p-2">
              {shortcuts.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-blue-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-700 dark:hover:bg-slate-800">
                    <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">{item.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-800 group-hover:text-blue-800 dark:text-slate-100">{item.label}</span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{item.text}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {announcements.length > 0 && (
            <section aria-labelledby="city-news" className={CARD}>
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <h2 id="city-news" className="text-base font-bold text-slate-900 dark:text-slate-100">City updates</h2>
                <Link href="/announcements" className="text-sm font-semibold text-blue-800 hover:underline dark:text-blue-300">All</Link>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {announcements.map((item) => (
                  <li key={item.id}>
                    <Link href={`/announcements/${item.id}`} className="block px-5 py-3.5 transition-colors hover:bg-blue-50/60 dark:hover:bg-slate-800/60">
                      <span className="block text-xs text-slate-500 dark:text-slate-400">{dateLabel(item.published_at ?? item.created_at)}</span>
                      <span className="mt-0.5 block text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">{item.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
