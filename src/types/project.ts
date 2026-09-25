import type { Location } from "./location";

/** GET /api/projects item. `location` is an embedded relationship (may be null). */
export interface Project {
  id: number;
  title: string;
  description: string | null;
  category: string;
  status: string;
  budget: number | null;
  contract_amount: number | null;
  start_date: string | null;
  target_completion: string | null;
  completion_percentage: number;
  location: Location | null;
  created_at: string;
  updated_at: string;
}
