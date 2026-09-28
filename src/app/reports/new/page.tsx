"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { useAuth } from "@/components/auth-provider";
import { ScopedThemeProvider } from "@/components/theme-provider";
import { getLocations } from "@/lib/api/locations";
import { createCommunityReport } from "@/lib/api/community-reports";
import { ApiError, getFriendlyErrorMessage } from "@/lib/api/client";
import type { Location } from "@/types";

const CATEGORIES = ["road", "flooding", "garbage", "streetlight", "accessibility", "environment", "other"];

export default function NewReportPage() {
  const router = useRouter();
  const { status } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState("");
  const [category, setCategory] = useState("road");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?next=/reports/new");
    if (status !== "authenticated") return;
    getLocations({ per_page: 50 })
      .then((result) => setLocations(result.data))
      .catch((reason: unknown) => setError(getFriendlyErrorMessage(reason)))
      .finally(() => setLoadingLocations(false));
  }, [status, router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    if (!locationId || !title.trim()) {
      setFieldErrors({
        ...(!locationId ? { location_id: ["Choose a location."] } : {}),
        ...(!title.trim() ? { title: ["Enter a report title."] } : {}),
      });
      return;
    }
    setSubmitting(true);
    try {
      await createCommunityReport({
        location_id: Number(locationId),
        category,
        title: title.trim(),
        description: description.trim() || undefined,
      });
      router.replace("/reports?submitted=1");
      router.refresh();
    } catch (reason) {
      if (reason instanceof ApiError && reason.validationErrors) setFieldErrors(reason.validationErrors);
      else setError(getFriendlyErrorMessage(reason));
    } finally {
      setSubmitting(false);
    }
  }

  const errorFor = (field: string) => fieldErrors[field]?.[0];
  const control = "mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-900";

  return (
    <ScopedThemeProvider scope="user">
    <div className="flex min-h-full flex-col bg-slate-50 font-sans transition-colors dark:bg-slate-950">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-14">
        <Link href="/reports" className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300">← My reports</Link>
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/70 sm:p-7"><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">Community participation</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">Submit a community report</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">Share an issue in General Santos City. Your report will be submitted for review; you can track its status in My Reports.</p></div>
          <div className="p-5 sm:p-7">
          {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200">{error}</p>}
          <form onSubmit={onSubmit} noValidate className="mt-7 space-y-5">
            <div>
              <label htmlFor="report-location" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Location</label>
              <select id="report-location" className={control} value={locationId} onChange={(event) => setLocationId(event.target.value)} disabled={loadingLocations || submitting} aria-invalid={Boolean(errorFor("location_id"))}>
                <option value="">{loadingLocations ? "Loading locations…" : "Choose a listed location"}</option>
                {locations.map((location) => <option key={location.id} value={location.id}>{location.name}{location.barangay ? ` · ${location.barangay}` : ""}</option>)}
              </select>
              {errorFor("location_id") && <p className="mt-1 text-sm text-red-700 dark:text-red-300">{errorFor("location_id")}</p>}
            </div>
            <div>
              <label htmlFor="report-category" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Category</label>
              <select id="report-category" className={control} value={category} onChange={(event) => setCategory(event.target.value)} disabled={submitting}>
                {CATEGORIES.map((item) => <option key={item} value={item}>{item.charAt(0).toUpperCase() + item.slice(1)}</option>)}
              </select>
              {errorFor("category") && <p className="mt-1 text-sm text-red-700 dark:text-red-300">{errorFor("category")}</p>}
            </div>
            <div>
              <label htmlFor="report-title" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Report title</label>
              <input id="report-title" className={control} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={255} required disabled={submitting} aria-invalid={Boolean(errorFor("title"))} />
              {errorFor("title") && <p className="mt-1 text-sm text-red-700 dark:text-red-300">{errorFor("title")}</p>}
            </div>
            <div>
              <label htmlFor="report-description" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">Details <span className="font-normal text-slate-500 dark:text-slate-400">(optional)</span></label>
              <textarea id="report-description" className={`${control} min-h-32 resize-y`} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} disabled={submitting} />
              <p className="mt-1 text-right text-xs text-slate-500 dark:text-slate-400">{description.length}/5000</p>
              {errorFor("description") && <p className="mt-1 text-sm text-red-700 dark:text-red-300">{errorFor("description")}</p>}
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
              <Link href="/reports" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</Link>
              <button type="submit" disabled={submitting || loadingLocations || locations.length === 0} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">{submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}{submitting ? "Submitting…" : "Submit report"}</button>
            </div>
          </form>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
    </ScopedThemeProvider>
  );
}
