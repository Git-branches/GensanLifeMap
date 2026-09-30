import { apiFetch, type ApiFetchOptions } from "./client";
import type {
  DataSource,
  PaginatedResponse,
  PaginationParams,
} from "@/types";

export interface DataSourceFilters extends PaginationParams {
  source_type?: string;
}

export function getDataSources(
  filters: DataSourceFilters = {},
  options: ApiFetchOptions = {},
) {
  return apiFetch<PaginatedResponse<DataSource>>("/data-sources", {
    ...options,
    query: { ...filters },
  });
}

export function getDataSource(id: number) {
  return apiFetch<DataSource>(`/data-sources/${id}`);
}
