import { apiFetch, type ApiFetchOptions } from "./client";
import type {
  Announcement,
  PaginatedResponse,
  PaginationParams,
} from "@/types";

export interface AnnouncementFilters extends PaginationParams {
  category?: string;
  status?: string;
}

export function getAnnouncements(
  filters: AnnouncementFilters = {},
  options: ApiFetchOptions = {},
) {
  return apiFetch<PaginatedResponse<Announcement>>("/announcements", {
    ...options,
    query: { ...filters },
  });
}

export function getAnnouncement(id: number) {
  return apiFetch<{ data: Announcement }>(`/announcements/${id}`).then((response) => response.data);
}
