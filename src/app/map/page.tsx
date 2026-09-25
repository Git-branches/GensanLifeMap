/**
 * GenSan LifeMap — main public map page (Phase 5A).
 *
 * Async Server Component: fetches locations, projects and facilities from
 * the Laravel API (via the Phase 4 service layer) and hands plain data to
 * the <LifeMap /> client shell, which owns search / filters / selection.
 * If every endpoint fails, a friendly error is rendered instead of the map.
 */

import Link from "next/link";
import LifeMap from "@/components/lifemap/life-map";
import SiteHeader from "@/components/site-header";
import { buttonClasses } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/states";
import {
  getFacilities,
  getFriendlyErrorMessage,
  getLocations,
  getProjects,
} from "@/lib/api";
import { buildMapItems } from "@/lib/map-items";

export const metadata = {
  title: "LifeMap | GenSan LifeMap",
  description:
    "Interactive public map of General Santos City locations, projects and facilities.",
};

// NOTE: the Laravel API caps per_page at 50 (422 beyond that).
const FETCH_OPTS = { revalidate: 60 };
const PAGE_SIZE = 50;

export default async function MapPage() {
  const [loc, proj, fac] = await Promise.allSettled([
    getLocations({ per_page: PAGE_SIZE }, FETCH_OPTS),
    getProjects({ per_page: PAGE_SIZE }, FETCH_OPTS),
    getFacilities({ per_page: PAGE_SIZE }, FETCH_OPTS),
  ]);

  const failures = [loc, proj, fac].filter((r) => r.status === "rejected");
  if (failures.length === 3) {
    const message = getFriendlyErrorMessage(
      (failures[0] as PromiseRejectedResult).reason,
    );
    return (
      <div className="flex h-dvh flex-col bg-zinc-50 font-sans dark:bg-black">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4">
          <div className="w-full text-center">
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              The map is temporarily unavailable
            </h1>
            <div className="mt-3 text-left">
              <ErrorState message={message} />
            </div>
            <Link href="/map" className={buttonClasses("primary", "md", "mt-4")}>
              Try again
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const locations = loc.status === "fulfilled" ? loc.value.data : [];
  const projects = proj.status === "fulfilled" ? proj.value.data : [];
  const facilities = fac.status === "fulfilled" ? fac.value.data : [];
  const { items, skippedWithoutCoordinates } = buildMapItems(
    locations,
    projects,
    facilities,
  );

  const failedKinds = [
    loc.status === "rejected" ? "locations" : null,
    proj.status === "rejected" ? "projects" : null,
    fac.status === "rejected" ? "facilities" : null,
  ].filter((k): k is string => k !== null);

  return (
    <div className="flex h-dvh flex-col bg-zinc-50 font-sans dark:bg-black">
      <SiteHeader />
      <LifeMap
        items={items}
        skippedWithoutCoordinates={skippedWithoutCoordinates}
        warning={
          failedKinds.length > 0
            ? `Some data could not be loaded (${failedKinds.join(", ")}). Showing what's available.`
            : null
        }
      />
    </div>
  );
}
