"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type FormEvent } from "react";
import ReportTimeline from "@/components/account/report-timeline";
import { REPORT_STATUS_LABELS, ReportStatusPill } from "@/components/account/report-status";
import Modal from "@/components/ui/modal";
import { getAdminReport, updateReportStatus } from "@/lib/api/admin";
import { ApiError, getFriendlyErrorMessage } from "@/lib/api/client";
import type { CommunityReport, CommunityReportStatus } from "@/types/community-report";

const ReportMap = dynamic(() => import("@/components/lifemap/location-picker"), {
  ssr: false,
  loading: () => <div className="flex h-48 w-full items-center justify-center bg-slate-100 text-sm text-slate-500">Loading map…</div>,
});

/** Same workflow the API enforces; the server rejects anything else. */
const NEXT_STATUSES: Record<CommunityReportStatus, CommunityReportStatus[]> = {
  submitted: ["under_review", "verified", "rejected"],
  under_review: ["verified", "resolved", "rejected"],
  verified: ["resolved", "rejected"],
  resolved: [],
  rejected: [],
};

const NOTE_LIMIT = 500;

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Staff view of one resident report: everything the resident sent, the
 * full history (with who changed what), and one place to move it to the
 * next status with an optional message the resident will see.
 */
export default function ReportReviewDialog({
  reportId,
  onClose,
  onChanged,
}: {
  reportId: number;
  onClose: () => void;
  /** Called after a status change so the list behind the dialog can refresh. */
  onChanged: () => void;
}) {
  const [report, setReport] = useState<CommunityReport | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminReport(reportId)
      .then((result) => { if (!cancelled) setReport(result); })
      .catch((reason: unknown) => { if (!cancelled) setLoadError(getFriendlyErrorMessage(reason)); });
    return () => { cancelled = true; };
  }, [reportId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!report || !nextStatus) return;
    setSaving(true);
    setFormError(null);
    setSaved(null);
    try {
      const updated = await updateReportStatus(report.id, nextStatus, note);
      setReport(updated);
      setSaved(`Moved to ${REPORT_STATUS_LABELS[updated.status]}. The resident can see this in their timeline.`);
      setNextStatus("");
      setNote("");
      onChanged();
    } catch (reason) {
      if (reason instanceof ApiError && reason.validationErrors) {
        setFormError(Object.values(reason.validationErrors).flat().join(" "));
      } else {
        setFormError(getFriendlyErrorMessage(reason));
      }
    } finally {
      setSaving(false);
    }
  }

  const options = report ? NEXT_STATUSES[report.status] : [];
  const control = "mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

  return (
    <Modal label={report ? `Review report: ${report.title}` : "Review report"} onClose={onClose} wide>
      <div className="px-1 pb-2 sm:px-2">
        {loadError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{loadError}</p>}
        {!report && !loadError && <div className="space-y-3"><div className="h-6 w-1/3 animate-pulse rounded bg-slate-100" /><div className="h-40 animate-pulse rounded-xl bg-slate-100" /></div>}

        {report && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">{report.category.replaceAll("_", " ")}</p>
              <ReportStatusPill status={report.status} />
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold leading-snug text-zinc-900">{report.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">
              From {report.user?.name ?? "a resident"} · {report.location?.name ?? "Location unavailable"}{report.location?.barangay ? ` · ${report.location.barangay}` : ""} · {dateLabel(report.created_at)}
            </p>

            {report.photo_url && (
              /* eslint-disable-next-line @next/next/no-img-element -- served by the API, not part of the optimised image set */
              <img src={report.photo_url} alt="Photo attached to this report" className="mt-5 max-h-80 w-full rounded-xl border border-zinc-200 object-cover" />
            )}

            <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{report.description || "No additional description provided."}</p>

            {report.latitude !== null && report.longitude !== null && (
              <div className="mt-5">
                <h3 className="text-sm font-bold text-zinc-900">Pinned location</h3>
                <div className="mt-2 overflow-hidden rounded-xl border border-zinc-200">
                  <ReportMap value={{ lat: report.latitude, lng: report.longitude }} readOnly className="h-48 w-full" />
                </div>
                <p className="mt-1 text-xs text-zinc-500">{report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}</p>
              </div>
            )}

            <div className="mt-6 border-t border-zinc-100 pt-5">
              <h3 className="text-sm font-bold text-zinc-900">History</h3>
              <div className="mt-4">{report.timeline && <ReportTimeline events={report.timeline} />}</div>
            </div>

            <div className="mt-6 border-t border-zinc-100 pt-5">
              <h3 className="text-sm font-bold text-zinc-900">Update status</h3>
              {options.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">This report is closed ({REPORT_STATUS_LABELS[report.status].toLowerCase()}), so its status can no longer change.</p>
              ) : (
                <form onSubmit={submit} className="mt-3 space-y-4">
                  <div>
                    <label htmlFor="review-status" className="block text-sm font-semibold text-zinc-800">Move to</label>
                    <select id="review-status" required value={nextStatus} onChange={(event) => setNextStatus(event.target.value)} disabled={saving} className={control}>
                      <option value="">Choose the next status…</option>
                      {options.map((status) => <option key={status} value={status}>{REPORT_STATUS_LABELS[status]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="review-note" className="block text-sm font-semibold text-zinc-800">
                      Message to the resident <span className="font-normal text-zinc-500">(optional)</span>
                    </label>
                    <textarea
                      id="review-note"
                      value={note}
                      onChange={(event) => setNote(event.target.value.slice(0, NOTE_LIMIT))}
                      maxLength={NOTE_LIMIT}
                      rows={3}
                      disabled={saving}
                      placeholder="e.g. A crew is scheduled for Friday."
                      className={`${control} resize-y`}
                    />
                    <p className="mt-1 text-right text-xs text-zinc-500">{note.length}/{NOTE_LIMIT} · shown on their report timeline</p>
                  </div>
                  {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{formError}</p>}
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button type="button" onClick={onClose} className="min-h-11 rounded-full border border-zinc-300 px-5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50">Close</button>
                    <button type="submit" disabled={saving || !nextStatus} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
                      {saving && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                      {saving ? "Saving…" : "Update status"}
                    </button>
                  </div>
                </form>
              )}
              {saved && <p role="status" className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{saved}</p>}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
