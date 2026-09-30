/**
 * Map-domain helpers for the LifeMap page. Pure functions only — no UI,
 * no fetch. Keeps coordinate validation and search/filter logic outside
 * React components and unit-testable.
 */

import type { Facility, Location, Project } from "@/types";

export type MapItemKind = "location" | "project" | "facility";

export const MAP_ITEM_KINDS: MapItemKind[] = [
  "location",
  "project",
  "facility",
];

export interface MapItemBase {
  kind: MapItemKind;
  /** Stable selection key, namespaced by kind (ids overlap across tables). */
  key: string;
  label: string;
  description: string | null;
  category: string;
  barangay: string | null;
  latitude: number;
  longitude: number;
  /**
   * Extra kind-specific keywords folded into free-text search
   * (e.g. project status). Kept separate so the filter stays extensible
   * for future data types without changing its signature.
   */
  searchKeywords: string[];
}

export interface LocationMapItem extends MapItemBase {
  kind: "location";
  record: Location;
}

export interface ProjectMapItem extends MapItemBase {
  kind: "project";
  record: Project;
  status: string;
}

export interface FacilityMapItem extends MapItemBase {
  kind: "facility";
  record: Facility;
  contactNumber: string | null;
  operatingHours: string | null;
}

export type MapItem = LocationMapItem | ProjectMapItem | FacilityMapItem;

/** Geographic center of General Santos City (fallback map view). */
export const GENSAN_CENTER: { lat: number; lng: number; zoom: number } = {
  lat: 6.1164,
  lng: 125.1712,
  zoom: 13,
};

/**
 * A coordinate is usable only when both parts are finite numbers inside
 * valid geographic ranges. Records failing this check get NO marker.
 */
export function isValidCoordinate(
  latitude: number | string | null | undefined,
  longitude: number | string | null | undefined,
): latitude is number {
  const lat = typeof latitude === "string" ? Number(latitude) : latitude;
  const lng = typeof longitude === "string" ? Number(longitude) : longitude;
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function toNumber(
  value: number | string | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

export interface BuildMapItemsResult {
  items: MapItem[];
  /** Count of records skipped because they lack usable coordinates. */
  skippedWithoutCoordinates: number;
}

/**
 * Flattens the three API collections into one marker list.
 * Projects/facilities inherit coordinates (and barangay) from their
 * embedded `location` relationship; anything unmappable is counted
 * in `skippedWithoutCoordinates` instead of crashing the map.
 */
export function buildMapItems(
  locations: Location[],
  projects: Project[],
  facilities: Facility[],
): BuildMapItemsResult {
  const items: MapItem[] = [];
  let skippedWithoutCoordinates = 0;

  for (const record of locations) {
    if (!isValidCoordinate(record.latitude, record.longitude)) {
      skippedWithoutCoordinates += 1;
      continue;
    }
    items.push({
      kind: "location",
      key: `location-${record.id}`,
      label: record.name,
      description: record.address,
      category: record.location_type,
      barangay: record.barangay,
      latitude: toNumber(record.latitude) as number,
      longitude: toNumber(record.longitude) as number,
      searchKeywords: [],
      record,
    });
  }

  for (const record of projects) {
    const loc = record.location;
    if (!loc || !isValidCoordinate(loc.latitude, loc.longitude)) {
      skippedWithoutCoordinates += 1;
      continue;
    }
    items.push({
      kind: "project",
      key: `project-${record.id}`,
      label: record.title,
      description: record.description,
      category: record.category,
      barangay: loc.barangay,
      latitude: toNumber(loc.latitude) as number,
      longitude: toNumber(loc.longitude) as number,
      searchKeywords: [record.status],
      record,
      status: record.status,
    });
  }

  for (const record of facilities) {
    const loc = record.location;
    if (!loc || !isValidCoordinate(loc.latitude, loc.longitude)) {
      skippedWithoutCoordinates += 1;
      continue;
    }
    items.push({
      kind: "facility",
      key: `facility-${record.id}`,
      label: record.name,
      description: record.description,
      category: record.category,
      barangay: loc.barangay,
      latitude: toNumber(loc.latitude) as number,
      longitude: toNumber(loc.longitude) as number,
      searchKeywords: [],
      record,
      contactNumber: record.contact_number,
      operatingHours: record.operating_hours,
    });
  }

  return { items, skippedWithoutCoordinates };
}

export type KindFilter = MapItemKind | "all";

export interface MapItemQuery {
  kind: KindFilter;
  /** Free-text search; matched client-side against useful text fields. */
  search: string;
}

/**
 * Applies the kind filter + free-text search to already-fetched items.
 * Search is a case-insensitive substring match over label, description,
 * category, barangay and kind-specific keywords (e.g. project status).
 * No backend queries are issued from here.
 */
export function filterMapItems(items: MapItem[], query: MapItemQuery): MapItem[] {
  const needle = query.search.trim().toLowerCase();
  return items.filter((item) => {
    if (query.kind !== "all" && item.kind !== query.kind) return false;
    if (needle === "") return true;
    const haystack = [item.label, item.description, item.category, item.barangay, ...item.searchKeywords]
      .filter((part): part is string => typeof part === "string" && part !== "")
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export function countByKind(items: MapItem[]): Record<MapItemKind, number> {
  return {
    location: items.filter((i) => i.kind === "location").length,
    project: items.filter((i) => i.kind === "project").length,
    facility: items.filter((i) => i.kind === "facility").length,
  };
}
