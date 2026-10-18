/** Small geographic helpers (pure functions, no UI). */

export interface LatLng {
  lat: number;
  lng: number;
}

/** Great-circle distance in metres (haversine). */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** "120 m" under a kilometre, "2.4 km" beyond. */
export function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.max(10, Math.round(meters / 10) * 10)} m` : `${(meters / 1000).toFixed(1)} km`;
}

/** The listed record closest to `point`, with its distance. */
export function nearestTo<T extends { latitude: number | null; longitude: number | null }>(
  point: LatLng,
  items: T[],
): { item: T; meters: number } | null {
  let best: { item: T; meters: number } | null = null;
  for (const item of items) {
    if (item.latitude === null || item.longitude === null) continue;
    const meters = distanceMeters(point, { lat: Number(item.latitude), lng: Number(item.longitude) });
    if (!best || meters < best.meters) best = { item, meters };
  }
  return best;
}
