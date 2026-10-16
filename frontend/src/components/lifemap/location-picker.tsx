"use client";

/**
 * Small Leaflet map for choosing (or just showing) one exact spot.
 * Loaded with next/dynamic and ssr:false, like the main LifeMap, because
 * Leaflet touches `window` at import time.
 *
 * - Editable: click the map or drag the pin to set the position.
 * - `readOnly`: shows the pin only (report details).
 */

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import type { LatLng } from "@/lib/geo";
import { GENSAN_CENTER } from "@/lib/map-items";

const pinIcon = L.divIcon({
  className: "lifemap-marker-wrap",
  html: '<span class="lifemap-dot lifemap-dot--project lifemap-dot--selected"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function ClickToPin({ onChange }: { onChange: (position: LatLng) => void }) {
  useMapEvents({
    click(event) {
      onChange({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

/** Moves the camera when `target` changes (e.g. "use my location"). */
function FlyTo({ target }: { target: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 17), { duration: 0.6 });
  }, [map, target]);
  return null;
}

export default function LocationPicker({
  value,
  onChange,
  flyTarget = null,
  readOnly = false,
  className = "h-72 w-full",
}: {
  value: LatLng | null;
  onChange?: (position: LatLng) => void;
  flyTarget?: LatLng | null;
  readOnly?: boolean;
  className?: string;
}) {
  const center: [number, number] = value ? [value.lat, value.lng] : [GENSAN_CENTER.lat, GENSAN_CENTER.lng];

  return (
    <MapContainer
      center={center}
      zoom={value ? 16 : GENSAN_CENTER.zoom}
      scrollWheelZoom={false}
      zoomControl={false}
      // `isolate` keeps Leaflet's internal z-indexes (panes 400, controls
      // 1000) inside the map so it can't paint over sticky bars or modals.
      className={`isolate ${className}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <ZoomControl position="topright" />
      {!readOnly && onChange && <ClickToPin onChange={onChange} />}
      <FlyTo target={flyTarget} />
      {value && (
        <Marker
          position={[value.lat, value.lng]}
          icon={pinIcon}
          draggable={!readOnly}
          eventHandlers={
            readOnly || !onChange
              ? undefined
              : {
                  dragend(event) {
                    const { lat, lng } = (event.target as L.Marker).getLatLng();
                    onChange({ lat, lng });
                  },
                }
          }
        />
      )}
    </MapContainer>
  );
}
