"use client";

/**
 * Leaflet map for the LifeMap page (react-leaflet).
 *
 * This module only runs in the browser: it is loaded via next/dynamic
 * with ssr:false from the LifeMap shell because Leaflet touches `window`
 * at import time. Markers use CSS divIcons (no image assets, so no
 * broken-icon bundler issues) colored by record kind.
 */

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  ScaleControl,
  TileLayer,
  useMap,
  ZoomControl,
} from "react-leaflet";
import {
  GENSAN_CENTER,
  type MapItem,
  type MapItemKind,
} from "@/lib/map-items";

const KIND_LABEL: Record<MapItemKind, string> = {
  location: "Location",
  project: "Project",
  facility: "Facility",
};

const KIND_BADGE_CLASS: Record<MapItemKind, string> = {
  location: "lifemap-badge lifemap-badge--location",
  project: "lifemap-badge lifemap-badge--project",
  facility: "lifemap-badge lifemap-badge--facility",
};

function iconFor(kind: MapItemKind, selected: boolean): L.DivIcon {
  return L.divIcon({
    className: "lifemap-marker-wrap",
    html: `<span class="lifemap-dot lifemap-dot--${kind}${selected ? " lifemap-dot--selected" : ""}"></span>`,
    iconSize: selected ? [24, 24] : [18, 18],
    iconAnchor: selected ? [12, 12] : [9, 9],
    popupAnchor: [0, -12],
  });
}

// Module-level cache: icons are pure functions of (kind, selected),
// so they can be shared across renders without render-scope mutation.
const iconCache = new Map<string, L.DivIcon>();

function cachedIcon(kind: MapItemKind, selected: boolean): L.DivIcon {
  const cacheKey = `${kind}:${selected}`;
  let icon = iconCache.get(cacheKey);
  if (!icon) {
    icon = iconFor(kind, selected);
    iconCache.set(cacheKey, icon);
  }
  return icon;
}

/**
 * Small map chrome: fullscreen toggle + live result count.
 * Rendered inside <MapContainer> so it can use `useMap`, but visually
 * positioned as absolute overlays (Leaflet panes sit below z-[500]).
 */
function MapChrome({ count }: { count: number }) {
  const map = useMap();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    const el = map.getContainer().parentElement ?? map.getContainer();
    if (!document.fullscreenElement) {
      void el.requestFullscreen?.().catch(() => undefined);
    } else {
      void document.exitFullscreen().catch(() => undefined);
    }
  }, [map]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Invalidate size after entering/leaving fullscreen so tiles repaint.
  useEffect(() => {
    const t = window.setTimeout(() => map.invalidateSize(), 250);
    return () => window.clearTimeout(t);
  }, [map, isFullscreen]);

  return (
    <>
      <div className="lifemap-legend" aria-label="Map legend">
        <span className="lifemap-legend-title">Legend</span>
        <span className="lifemap-legend-row">
          <span className="lifemap-legend-dot lifemap-legend-dot--location" />
          Locations
        </span>
        <span className="lifemap-legend-row">
          <span className="lifemap-legend-dot lifemap-legend-dot--project" />
          Projects
        </span>
        <span className="lifemap-legend-row">
          <span className="lifemap-legend-dot lifemap-legend-dot--facility" />
          Facilities
        </span>
        <span className="lifemap-legend-count" aria-live="polite">
          {count} shown
        </span>
      </div>
      <button
        type="button"
        onClick={toggleFullscreen}
        className="lifemap-fullscreen"
        aria-pressed={isFullscreen}
        title={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
      >
        {isFullscreen ? "⤢ Exit" : "⤢ Fullscreen"}
      </button>
    </>
  );
}

/**
 * Imperative camera moves: fly to the selected marker, fit the map to
 * the current kind filter, reset to the GenSan default view, or open a
 * marker popup on behalf of the results list.
 */
function MapController({
  items,
  fitItems,
  selectedKey,
  resetSignal,
  popupRequest,
  markerRefs,
}: {
  items: MapItem[];
  fitItems: MapItem[];
  selectedKey: string | null;
  resetSignal: number;
  popupRequest: { key: string; signal: number };
  markerRefs: React.RefObject<Map<string, L.Marker>>;
}) {
  const map = useMap();

  // Latest items for camera effects. The ref is synced in an effect (never
  // during render) so rapid parent re-renders (e.g. typing in search) don't
  // retrigger camera moves — only selectedKey / fitItems identity do.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  });

  useEffect(() => {
    if (!selectedKey) return;
    const target = itemsRef.current.find((i) => i.key === selectedKey);
    if (target) {
      map.flyTo([target.latitude, target.longitude], Math.max(map.getZoom(), 15), {
        duration: 0.6,
      });
    }
  }, [map, selectedKey]);

  useEffect(() => {
    if (fitItems.length === 0) return;
    const bounds = L.latLngBounds(
      fitItems.map((i) => [i.latitude, i.longitude] as [number, number]),
    );
    map.flyToBounds(bounds, { padding: [48, 48], duration: 0.6 });
    // fitItems is memoized by the parent per kind filter, so identity only
    // changes when the filtered membership actually changes.
  }, [map, fitItems]);

  useEffect(() => {
    if (resetSignal === 0) return;
    map.flyTo([GENSAN_CENTER.lat, GENSAN_CENTER.lng], GENSAN_CENTER.zoom, {
      duration: 0.6,
    });
  }, [map, resetSignal]);

  // Results-list clicks select AND reveal the same compact popup a marker
  // click would show, keeping one interaction model for both entry points.
  useEffect(() => {
    if (popupRequest.signal === 0) return;
    markerRefs.current?.get(popupRequest.key)?.openPopup();
  }, [map, popupRequest, markerRefs]);

  return null;
}

export default function MapView({
  items,
  fitItems,
  selectedKey,
  resetSignal,
  popupRequest,
  onSelect,
  onViewDetails,
}: {
  /** Markers actually rendered (kind filter + search applied). */
  items: MapItem[];
  /** Items used for fit-to-results (kind filter applied, search ignored). */
  fitItems: MapItem[];
  selectedKey: string | null;
  resetSignal: number;
  /** Incremented by results-list clicks to reveal that marker's popup. */
  popupRequest: { key: string; signal: number };
  onSelect: (key: string) => void;
  onViewDetails: (key: string) => void;
}) {
  const markerRefs = useRef(new Map<string, L.Marker>());

  return (
    <MapContainer
      center={[GENSAN_CENTER.lat, GENSAN_CENTER.lng]}
      zoom={GENSAN_CENTER.zoom}
      scrollWheelZoom
      zoomControl={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <ZoomControl position="topright" />
      <ScaleControl position="bottomright" imperial={false} />
      <MapChrome count={items.length} />
      <MapController
        items={items}
        fitItems={fitItems}
        selectedKey={selectedKey}
        resetSignal={resetSignal}
        popupRequest={popupRequest}
        markerRefs={markerRefs}
      />
      {items.map((item) => (
        <Marker
          key={item.key}
          position={[item.latitude, item.longitude]}
          icon={cachedIcon(item.kind, item.key === selectedKey)}
          eventHandlers={{ click: () => onSelect(item.key) }}
          ref={(marker) => {
            if (marker) markerRefs.current.set(item.key, marker);
            else markerRefs.current.delete(item.key);
          }}
        >
          <Popup>
            <div className="lifemap-popup">
              <p className="lifemap-popup-kind">
                <span className={KIND_BADGE_CLASS[item.kind]}>
                  {KIND_LABEL[item.kind]}
                </span>
                <span className="lifemap-popup-category">{item.category}</span>
              </p>
              <p className="lifemap-popup-title">{item.label}</p>
              {item.barangay && (
                <p className="lifemap-popup-meta">Brgy. {item.barangay}</p>
              )}
              {item.kind === "project" && item.status && (
                <p className="lifemap-popup-meta">
                  Status: <strong>{item.status}</strong>
                </p>
              )}
              {item.description && (
                <p className="lifemap-popup-desc">
                  {item.description.length > 110
                    ? `${item.description.slice(0, 110)}…`
                    : item.description}
                </p>
              )}
              <button
                type="button"
                onClick={() => onViewDetails(item.key)}
                className="lifemap-popup-action"
              >
                View Details →
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
