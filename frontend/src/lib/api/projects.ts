import { apiFetch, type ApiFetchOptions } from "./client";
import type {
  PaginatedResponse,
  PaginationParams,
  Project,
} from "@/types";

export interface ProjectFilters extends PaginationParams {
  status?: string;
  category?: string;
}

export function getProjects(
  filters: ProjectFilters = {},
  options: ApiFetchOptions = {},
) {
  return apiFetch<PaginatedResponse<Project>>("/projects", {
    ...options,
    query: { ...filters },
  });
}

export async function getProject(id: number) {
  // Single-resource responses are wrapped in a `{ data }` envelope.
  const body = await apiFetch<{ data: Project }>(`/projects/${id}`);
  return body.data;
}
