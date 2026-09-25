import type { DataSource } from "./data-source";

/** GET /api/announcements item. `source` is an embedded relationship (may be null). */
export interface Announcement {
  id: number;
  title: string;
  content: string | null;
  category: string;
  status: string;
  published_at: string | null;
  expires_at: string | null;
  source: DataSource | null;
  created_at: string;
  updated_at: string;
}
