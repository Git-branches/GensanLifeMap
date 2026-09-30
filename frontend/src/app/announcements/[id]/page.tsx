import { notFound } from "next/navigation";
import DetailShell, { DetailRow } from "@/components/detail-page";
import { ApiError, getAnnouncement, getFriendlyErrorMessage } from "@/lib/api";
import type { Announcement } from "@/types";

export const metadata = {
  title: "Announcement | GenSan LifeMap",
  description: "Public announcement and its information source.",
};

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

export default async function AnnouncementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) notFound();

  let announcement: Announcement | null = null;
  let loadError: unknown = null;
  try {
    announcement = await getAnnouncement(numericId);
  } catch (error) {
    if (error instanceof ApiError && error.code === "NOT_FOUND") notFound();
    loadError = error;
  }

  if (loadError || !announcement) {
    return <DetailShell eyebrow="Announcement" title="Announcement unavailable" subtitle={null} backHref="/announcements" backLabel="Back to Announcements"><p role="alert" className="text-sm text-red-800">{getFriendlyErrorMessage(loadError)}</p></DetailShell>;
  }

  const published = formatDate(announcement.published_at ?? announcement.created_at);
  const expiry = formatDate(announcement.expires_at);
  return (
    <DetailShell eyebrow={announcement.category.replaceAll("_", " ")} title={announcement.title} subtitle={published ? `Published ${published}` : null} backHref="/announcements" backLabel="Back to Announcements">
      {announcement.content && <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{announcement.content}</p>}
      <dl className="mt-4 divide-y divide-slate-100">
        <DetailRow label="Category" value={announcement.category.replaceAll("_", " ")} />
        {announcement.source?.name && <DetailRow label="Information source" value={announcement.source.name} />}
        {expiry && <DetailRow label="Valid until" value={expiry} />}
      </dl>
    </DetailShell>
  );
}
