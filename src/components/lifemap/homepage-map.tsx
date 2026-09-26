"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { MapItem } from "@/lib/map-items";

const MapView = dynamic(() => import("./map-view"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-100 text-sm text-slate-500">
      Loading the city map...
    </div>
  ),
});

export default function HomepageMap({ items }: { items: MapItem[] }) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  return (
    <div className="relative h-105 overflow-hidden rounded-3xl bg-slate-100 sm:h-135">
      <MapView
        items={items}
        fitItems={items}
        selectedKey={selectedKey}
        resetSignal={0}
        popupRequest={{ key: "", signal: 0 }}
        onSelect={setSelectedKey}
        onViewDetails={() => undefined}
      />
      <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 sm:left-5 sm:right-5">
        {[
          ["Locations", "bg-blue-600"],
          ["Projects", "bg-amber-600"],
          ["Facilities", "bg-orange-500"],
        ].map(([label, color]) => (
          <span
            key={label}
            className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg backdrop-blur"
          >
            <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
