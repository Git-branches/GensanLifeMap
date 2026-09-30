/** GET /api/data-sources item. Also embedded as `source` on announcements. */
export interface DataSource {
  id: number;
  name: string;
  source_type: string;
  url: string | null;
  description: string | null;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}
