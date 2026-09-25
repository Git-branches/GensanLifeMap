import type { Location } from "./location";

/** GET /api/facilities item. `location` is an embedded relationship (may be null). */
export interface Facility {
  id: number;
  name: string;
  category: string;
  description: string | null;
  contact_number: string | null;
  operating_hours: string | null;
  location: Location | null;
  created_at: string;
  updated_at: string;
}
