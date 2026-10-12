"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
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

/**
 * Landing-page map preview. Fills its parent (the page sets the height)
 * and leaves page scrolling alone: wheel zoom is off, so scrolling past
 * the map never traps the visitor inside it.
 */
export default function HomepageMap({ items }: { items: MapItem[] }) {
  const router = useRouter();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const openDetails = (key: string) => {
    const item = items.find((i) => i.key === key);
    if (!item) return;
    const section = item.kind === "facility" ? "facilities" : `${item.kind}s`;
    router.push(`/${section}/${item.record.id}`);
  };

  return (
    <div className="relative z-0 h-full">
      <MapView
        items={items}
        fitItems={items}
        selectedKey={selectedKey}
        resetSignal={0}
        popupRequest={{ key: "", signal: 0 }}
        scrollWheelZoom={false}
        onSelect={setSelectedKey}
        onViewDetails={openDetails}
      />
    </div>
  );
}
