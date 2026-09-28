import type { Location } from "./location";

export type CommunityReportStatus =
  | "submitted"
  | "under_review"
  | "verified"
  | "resolved"
  | "rejected";

export interface CommunityReport {
  id: number;
  category: string;
  title: string;
  description: string | null;
  photo_path: string | null;
  status: CommunityReportStatus;
  user: { id: number; name: string } | null;
  location: Location | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCommunityReportInput {
  location_id: number;
  category: string;
  title: string;
  description?: string;
}
