/** GET /api/locations item. */
export interface Location {
  id: number;
  name: string;
  address: string | null;
  barangay: string | null;
  location_type: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}
