import { notFound } from "next/navigation";
import DetailShell, { DetailRow } from "@/components/detail-page";
import { ApiError, getFriendlyErrorMessage, getProject } from "@/lib/api";

export const metadata = {
  title: "Project Details | GenSan LifeMap",
  description: "Public details for a listed project in General Santos City.",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) notFound();

  let record = null;
  try {
    record = await getProject(numericId);
  } catch (e) {
    if (e instanceof ApiError && e.code === "NOT_FOUND") notFound();
    const message = getFriendlyErrorMessage(e);
    return (
      <DetailShell
        eyebrow="Project"
        title="Project unavailable"
        subtitle={null}
        backHref="/projects"
        backLabel="Back to Projects"
      >
        <div role="alert" className="text-sm text-red-800 dark:text-red-200">
          {message}
        </div>
      </DetailShell>
    );
  }

  const loc = record.location;
  const coords =
    loc &&
    loc.latitude !== null &&
    loc.longitude !== null &&
    Number.isFinite(loc.latitude) &&
    Number.isFinite(loc.longitude)
      ? `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`
      : null;

  return (
    <DetailShell
      eyebrow={`${record.category} · ${record.status}`}
      title={record.title}
      subtitle={loc?.barangay ? `Brgy. ${loc.barangay}` : null}
      backHref="/projects"
      backLabel="Back to Projects"
    >
      {record.description && (
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          {record.description}
        </p>
      )}
      <dl className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
        <DetailRow label="Category" value={record.category} />
        <DetailRow label="Status" value={record.status} />
        <DetailRow
          label="Completion"
          value={`${record.completion_percentage}%`}
        />
        {record.target_completion && (
          <DetailRow label="Target completion" value={record.target_completion} />
        )}
        {loc?.barangay && <DetailRow label="Barangay" value={loc.barangay} />}
        {loc?.name && <DetailRow label="Site" value={loc.name} />}
        {coords && <DetailRow label="Coordinates" value={coords} />}
      </dl>
    </DetailShell>
  );
}
