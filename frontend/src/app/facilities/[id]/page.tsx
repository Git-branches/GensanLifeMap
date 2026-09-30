import { notFound } from "next/navigation";
import DetailShell, { DetailRow } from "@/components/detail-page";
import { ApiError, getFacility, getFriendlyErrorMessage } from "@/lib/api";

export const metadata = {
  title: "Facility Details | GenSan LifeMap",
  description: "Public details for a listed facility in General Santos City.",
};

export default async function FacilityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) notFound();

  let record = null;
  try {
    record = await getFacility(numericId);
  } catch (e) {
    if (e instanceof ApiError && e.code === "NOT_FOUND") notFound();
    const message = getFriendlyErrorMessage(e);
    return (
      <DetailShell
        eyebrow="Facility"
        title="Facility unavailable"
        subtitle={null}
        backHref="/facilities"
        backLabel="Back to Facilities"
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
      eyebrow={record.category}
      title={record.name}
      subtitle={loc?.barangay ? `Brgy. ${loc.barangay}` : null}
      backHref="/facilities"
      backLabel="Back to Facilities"
    >
      {record.description && (
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          {record.description}
        </p>
      )}
      <dl className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-800">
        <DetailRow label="Category" value={record.category} />
        {loc?.barangay && <DetailRow label="Barangay" value={loc.barangay} />}
        {loc?.name && <DetailRow label="Location" value={loc.name} />}
        {record.contact_number && (
          <DetailRow label="Contact" value={record.contact_number} />
        )}
        {record.operating_hours && (
          <DetailRow label="Hours" value={record.operating_hours} />
        )}
        {coords && <DetailRow label="Coordinates" value={coords} />}
      </dl>
    </DetailShell>
  );
}
