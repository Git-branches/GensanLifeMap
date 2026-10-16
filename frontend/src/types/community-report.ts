import type { Location } from "./location";

export type CommunityReportStatus =
  | "submitted"
  | "under_review"
  | "verified"
  | "resolved"
  | "rejected";

/** One step in a report's history: the status it moved to and when. */
export interface CommunityReportEvent {
  status: CommunityReportStatus;
  at: string | null;
}

export interface CommunityReport {
  id: number;
  category: string;
  title: string;
  description: string | null;
  photo_path: string | null;
  /** Absolute URL of the uploaded photo, when there is one. */
  photo_url: string | null;
  /** Exact spot the resident pinned on the map, when they did. */
  latitude: number | null;
  longitude: number | null;
  status: CommunityReportStatus;
  user: { id: number; name: string } | null;
  location: Location | null;
  /** Status history; only present on the single-report (detail) response. */
  timeline?: CommunityReportEvent[];
  created_at: string;
  updated_at: string;
}

export interface CreateCommunityReportInput {
  location_id: number;
  category: string;
  title: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  photo?: File;
}
