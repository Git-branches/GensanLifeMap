"use client";

/**
 * Client shell for the LifeMap page: search, kind filters, result list,
 * marker selection and the details card. All API data arrives as props
 * from the Server Component parent; filtering/search run client-side
 * over the already-fetched records (no ad-hoc backend queries).
 *
 * The Leaflet map itself is dynamically imported with ssr:false because
 * Leaflet requires `window` at module load.
 */

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import RecordModal from "./record-modal";
import { toggleChipClasses } from "../ui/button";
import SearchField from "../ui/input";
import { EmptyState } from "../ui/states";
import {
  countByKind,
  filterMapItems,
  type KindFilter,
  type MapItem,
} from "@/lib/map-items";

const MapView = dynamic(() => import("./map-view"), {
  ssr: false,
  loading: () => (
    <div
      aria-label="Map loading"
      className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-900"
    >
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Loading interactive map…
      </p>
    </div>
  ),
});

const KIND_TABS: { value: KindFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "location", label: "Locations" },
  { value: "project", label: "Projects" },
  { value: "facility", label: "Facilities" },
];

const KIND_DOT_CLASS: Record<string, string> = {
  location: "bg-blue-600",
  project: "bg-green-600",
  facility: "bg-orange-500",
};

export default function LifeMap({
  items,
  skippedWithoutCoordinates,
  warning,
}: {
  items: MapItem[];
  skippedWithoutCoordinates: number;
  warning: string | null;
}) {
  const [kind, setKind] = useState<KindFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [modalKey, setModalKey] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [popupRequest, setPopupRequest] = useState<{ key: string; signal: number }>({
    key: "",
    signal: 0,
  });
  const itemRefs = useRef(new Map<string, HTMLLIElement>());

  const counts = useMemo(() => countByKind(items), [items]);

  // Kind-only subset drives counts + map auto-fit; search narrows further.
  const kindItems = useMemo(
    () => filterMapItems(items, { kind, search: "" }),
    [items, kind],
  );
  const visible = useMemo(
    () => filterMapItems(items, { kind, search }),
    [items, kind, search],
  );

  const modalItem = useMemo(
    () => items.find((i) => i.key === modalKey) ?? null,
    [items, modalKey],
  );

  // Results-list clicks select the record AND reveal its map popup —
  // the same compact popup a marker click shows.
  const selectFromList = (key: string) => {
    setSelectedKey((prev) => (prev === key ? null : key));
    setPopupRequest((prev) => ({ key, signal: prev.signal + 1 }));
  };

  // Keep the selected row in view when a marker is clicked.
  useEffect(() => {
    if (!selectedKey) return;
    itemRefs.current.get(selectedKey)?.scrollIntoView({ block: "nearest" });
  }, [selectedKey]);

  const tabCount = (value: KindFilter) =>
    value === "all" ? items.length : counts[value];

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      {/* Control panel */}
      <aside
        aria-label="Search and results"
        className="flex min-h-0 flex-1 flex-col border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:w-[380px] lg:flex-none lg:border-b-0 lg:border-r"
      >
        <div className="shrink-0 space-y-3 p-4 pb-3">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Interactive LifeMap
            </h1>
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Search places, filter by category, and select any marker to see
              its public details.
            </p>
          </div>
          <SearchField
            id="lifemap-search"
            label="Search GenSan"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, status, barangay…"
          />

          <div role="group" aria-label="Filter by type" className="flex flex-wrap gap-1.5">
            {KIND_TABS.map((tab) => {
              const isActive = kind === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setKind(tab.value)}
                  aria-pressed={isActive}
                  className={toggleChipClasses(isActive)}
                >
                  {tab.label}{" "}
                  <span className="opacity-70">({tabCount(tab.value)})</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2">
            <p aria-live="polite" className="text-xs text-zinc-500 dark:text-zinc-400">
              {visible.length === 0
                ? "No matching places found."
                : `${visible.length} place${visible.length === 1 ? "" : "s"} shown`}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setKind("all");
                setSelectedKey(null);
                setModalKey(null);
                setResetSignal((n) => n + 1);
              }}
              className="shrink-0 text-xs font-medium text-blue-700 hover:underline dark:text-blue-400"
            >
              Reset view
            </button>
          </div>

          {warning && (
            <p
              role="status"
              className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
            >
              {warning}
            </p>
          )}
        </div>

        {visible.length === 0 ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-4">
            <EmptyState
              title="No mapped places found."
              message="Try a different search term or category."
            />
          </div>
        ) : (
          <ul className="min-h-0 flex-1 divide-y divide-zinc-100 overflow-y-auto px-2 pb-4 dark:divide-zinc-800">
            {visible.map((item) => {
            const isSelected = item.key === selectedKey;
            return (
              <li
                key={item.key}
                ref={(el) => {
                  if (el) itemRefs.current.set(item.key, el);
                  else itemRefs.current.delete(item.key);
                }}
              >
                <button
                  type="button"
                  onClick={() => selectFromList(item.key)}
                  aria-pressed={isSelected}
                  className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    isSelected
                      ? "bg-blue-50 ring-1 ring-blue-600 dark:bg-blue-950"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${KIND_DOT_CLASS[item.kind]}`}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {item.label}
                    </span>
                    <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {[item.barangay ? `Brgy. ${item.barangay}` : null, item.category]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          </ul>
        )}

        {skippedWithoutCoordinates > 0 && (
          <p className="shrink-0 border-t border-zinc-100 px-4 py-2 text-[11px] text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
            {skippedWithoutCoordinates} record
            {skippedWithoutCoordinates === 1 ? "" : "s"} without map coordinates
            not shown.
          </p>
        )}
      </aside>

      {/* Map */}
      <div className="relative h-[44dvh] shrink-0 lg:h-auto lg:min-h-0 lg:flex-1">
        <div className="absolute inset-0 z-0">
          <MapView
            items={visible}
            fitItems={kindItems}
            selectedKey={selectedKey}
            resetSignal={resetSignal}
            popupRequest={popupRequest}
            onSelect={setSelectedKey}
            onViewDetails={setModalKey}
          />
        </div>
      </div>

      {/* Details modal: map state underneath is preserved; closing the
          modal returns the user to the exact same map view. */}
      {modalItem && (
        <RecordModal item={modalItem} onClose={() => setModalKey(null)} />
      )}
    </div>
  );
}
