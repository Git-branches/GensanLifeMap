import { apiFetch, type ApiFetchOptions } from "./client";
import type {
  Facility,
  PaginatedResponse,
  PaginationParams,
} from "@/types";

export interface FacilityFilters extends PaginationParams {
  category?: string;
}

export function getFacilities(
  filters: FacilityFilters = {},
  options: ApiFetchOptions = {},
) {
  return apiFetch<PaginatedResponse<Facility>>("/facilities", {
    ...options,
    query: { ...filters },
  });
}

export async function getFacility(id: number) {
  // Single-resource responses are wrapped in a `{ data }` envelope.
  const body = await apiFetch<{ data: Facility }>(`/facilities/${id}`);
  return body.data;
}
