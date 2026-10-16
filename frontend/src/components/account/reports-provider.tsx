"use client";

/**
 * Shared "my reports" state for the resident workspace, so the sidebar
 * badge, the dashboard and the reports list all agree and fetch once.
 *
 * "New update" means: staff changed the report's status and the resident
 * hasn't opened it since. The last-seen time of each report is remembered
 * in this browser only (localStorage) — it never leaves the device.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import { getFriendlyErrorMessage } from "@/lib/api";
import { getMyReports } from "@/lib/api/community-reports";
import type { CommunityReport } from "@/types/community-report";

const SEEN_KEY = "glm-reports-seen";

type SeenMap = Record<string, string>;

function readSeen(): SeenMap {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as SeenMap) : {};
  } catch {
    return {};
  }
}

interface ReportsContextValue {
  /** `null` until the first load finishes. */
  reports: CommunityReport[] | null;
  error: string | null;
  refresh: () => Promise<void>;
  /** Reports whose status changed since the resident last opened them. */
  updatedIds: ReadonlySet<number>;
  markSeen: (report: CommunityReport) => void;
}

const ReportsContext = createContext<ReportsContextValue | null>(null);

export function ReportsProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const [reports, setReports] = useState<CommunityReport[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState<SeenMap>({});

  const refresh = useCallback(async () => {
    try {
      const result = await getMyReports();
      setReports(result.data);
      setError(null);
    } catch (reason) {
      setReports((current) => current ?? []);
      setError(getFriendlyErrorMessage(reason));
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    getMyReports()
      .then((result) => {
        if (cancelled) return;
        setSeen(readSeen());
        setReports(result.data);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setReports((current) => current ?? []);
        setError(getFriendlyErrorMessage(reason));
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  const markSeen = useCallback((report: CommunityReport) => {
    setSeen((current) => {
      const next = { ...current, [report.id]: report.updated_at };
      try {
        window.localStorage.setItem(SEEN_KEY, JSON.stringify(next));
      } catch {
        /* Storage unavailable: the indicator just resets next visit. */
      }
      return next;
    });
  }, []);

  const updatedIds = useMemo(() => {
    const ids = new Set<number>();
    for (const report of reports ?? []) {
      if (report.status !== "submitted" && seen[report.id] !== report.updated_at) ids.add(report.id);
    }
    return ids;
  }, [reports, seen]);

  const value = useMemo(
    () => ({ reports, error, refresh, updatedIds, markSeen }),
    [reports, error, refresh, updatedIds, markSeen],
  );

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
}

export function useReports(): ReportsContextValue {
  const value = useContext(ReportsContext);
  if (!value) throw new Error("useReports must be used inside <ReportsProvider>.");
  return value;
}
