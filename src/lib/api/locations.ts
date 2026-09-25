import { apiFetch, type ApiFetchOptions } from "./client";
import type {
  Location,
  PaginatedResponse,
  PaginationParams,
} from "@/types";

export interface LocationFilters extends PaginationParams {
  barangay?: string;
  location_type?: string;
}

export function getLocations(
  filters: LocationFilters = {},
  options: ApiFetchOptions = {},
) {
  return apiFetch<PaginatedResponse<Location>>("/locations", {
    ...options,
    query: { ...filters },
  });
}

export async function getLocation(id: number) {
  // Single-resource responses are wrapped in a `{ data }` envelope.
  const body = await apiFetch<{ data: Location }>(`/locations/${id}`);
  return body.data;
}
