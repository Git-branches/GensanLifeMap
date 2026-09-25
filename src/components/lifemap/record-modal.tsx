"use client";

/**
 * Map record details dialog, rendered through the shared Modal shell so
 * it matches every other dialog in the system. Only fields actually
 * returned by the API are rendered; an image appears solely if the
 * record carries one.
 */

import type { MapItem } from "@/lib/map-items";
import { Badge } from "../ui/card";
import Modal from "../ui/modal";

const KIND_LABEL = {
  location: "Location",
  project: "Project",
  facility: "Facility",
} as const;

const KIND_TONE = {
  location: "info",
  project: "success",
  facility: "warning",
} as const;

/** Return an image URL only if the record actually carries one. */
function findImage(record: unknown): string | null {
  if (typeof record !== "object" || record === null) return null;
  for (const key of ["image_url", "image", "photo_url", "thumbnail"]) {
    const value = (record as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return null;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-right font-medium text-zinc-800 dark:text-zinc-100">
        {value}
      </dd>
    </div>
  );
}

function formatCoord(value: number | null): string | null {
  if (value === null || !Number.isFinite(value)) return null;
  return value.toFixed(4);
}

export default function RecordModal({
  item,
  onClose,
}: {
  item: MapItem;
  onClose: () => void;
}) {
  const image = findImage(item.record);
  const coords =
    formatCoord(item.latitude) && formatCoord(item.longitude)
      ? `${formatCoord(item.latitude)}, ${formatCoord(item.longitude)}`
      : null;

  return (
    <Modal label={`Details for ${item.label}`} onClose={onClose}>
      <Badge tone={KIND_TONE[item.kind]}>{KIND_LABEL[item.kind]}</Badge>

      <h2 className="mt-2 text-lg font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
        {item.label}
      </h2>
      {item.barangay && (
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Brgy. {item.barangay} · {item.category}
        </p>
      )}

      {image && (
        // Only rendered when the API actually supplies an image.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={item.label}
          className="mt-3 max-h-56 w-full rounded-lg object-cover"
        />
      )}

      <dl className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
        <Row label="Category" value={item.category} />
        {item.barangay && <Row label="Barangay" value={item.barangay} />}
        {item.kind === "project" && (
          <>
            <Row label="Status" value={item.status} />
            <Row
              label="Completion"
              value={`${item.record.completion_percentage}%`}
            />
            {item.record.target_completion && (
              <Row label="Target" value={item.record.target_completion} />
            )}
            {item.record.start_date && (
              <Row label="Started" value={item.record.start_date} />
            )}
          </>
        )}
        {item.kind === "facility" && (
          <>
            {item.contactNumber && (
              <Row label="Contact" value={item.contactNumber} />
            )}
            {item.operatingHours && (
              <Row label="Hours" value={item.operatingHours} />
            )}
          </>
        )}
        {item.kind === "location" && item.record.address && (
          <Row label="Address" value={item.record.address} />
        )}
        {coords && <Row label="Coordinates" value={coords} />}
      </dl>

      {item.description && (
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          {item.description}
        </p>
      )}
    </Modal>
  );
}
