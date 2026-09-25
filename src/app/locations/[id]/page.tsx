import { notFound } from "next/navigation";
import DetailShell, { DetailRow } from "@/components/detail-page";
import { ApiError, getFriendlyErrorMessage, getLocation } from "@/lib/api";

export const metadata = {
  title: "Location Details | GenSan LifeMap",
  description: "Public details for a listed location in General Santos City.",
};

function formatCoordinate(value: number | null): string | null {
  if (value === null || !Number.isFinite(value)) return null;
  return value.toFixed(4);
}

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) notFound();

  let record = null;
  try {
    record = await getLocation(numericId);
  } catch (e) {
    if (e instanceof ApiError && e.code === "NOT_FOUND") notFound();
    const message = getFriendlyErrorMessage(e);
    return (
      <DetailShell
        eyebrow="Location"
        title="Location unavailable"
        subtitle={null}
        backHref="/locations"
        backLabel="Back to Locations"
      >
        <div role="alert" className="text-sm text-red-800 dark:text-red-200">
          {message}
        </div>
      </DetailShell>
    );
  }

  const coords =
    formatCoordinate(record.latitude) && formatCoordinate(record.longitude)
      ? `${formatCoordinate(record.latitude)}, ${formatCoordinate(record.longitude)}`
      : null;

  return (
    <DetailShell
      eyebrow={record.location_type}
      title={record.name}
      subtitle={record.barangay ? `Brgy. ${record.barangay}` : null}
      backHref="/locations"
      backLabel="Back to Locations"
    >
      <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
        <DetailRow label="Type" value={record.location_type} />
        {record.barangay && <DetailRow label="Barangay" value={record.barangay} />}
        {record.address && <DetailRow label="Address" value={record.address} />}
        {coords && <DetailRow label="Coordinates" value={coords} />}
      </dl>
    </DetailShell>
  );
}
