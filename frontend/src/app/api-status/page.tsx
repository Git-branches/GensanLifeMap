/**
 * GenSan LifeMap — API status page (relocated Phase 4 integration check).
 *
 * Async Server Component: fetches REAL data from the Laravel REST API at
 * request time via the shared service layer (src/lib/api), which reads the
 * base URL from NEXT_PUBLIC_API_URL. No URLs are hard-coded here.
 *
 * Each resource is fetched independently (Promise.allSettled) so one failing
 * endpoint cannot take down the others. Every card renders one of:
 * data | empty | error states. Retry is handled by the <RefreshButton />
 * client component. This is a connectivity check, NOT the final UI.
 */

import RefreshButton from "@/components/refresh-button";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import {
  API_BASE_URL,
  getAnnouncements,
  getDataSources,
  getFacilities,
  getFriendlyErrorMessage,
  getLocations,
  getProjects,
} from "@/lib/api";
import type {
  Announcement,
  DataSource,
  Facility,
  Location,
  PaginatedResponse,
  Project,
} from "@/types";
import type { ReactNode } from "react";

export const metadata = {
  title: "API Status | GenSan LifeMap",
  description: "Live connectivity check between the Next.js frontend and the Laravel REST API.",
};

type Settled<T> =
  | { status: "success"; response: PaginatedResponse<T> }
  | { status: "error"; message: string };

function settle<T>(
  result: PromiseSettledResult<PaginatedResponse<T>>,
): Settled<T> {
  if (result.status === "fulfilled") {
    return { status: "success", response: result.value };
  }
  return { status: "error", message: getFriendlyErrorMessage(result.reason) };
}

function Section<T>({
  title,
  endpoint,
  state,
  renderItem,
  renderMeta,
}: {
  title: string;
  endpoint: string;
  state: Settled<T>;
  renderItem: (item: T) => ReactNode;
  renderMeta?: (item: T) => string | null;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {title}
          </h2>
          <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
            GET {endpoint}
          </p>
        </div>
        {state.status === "error" && <RefreshButton />}
      </div>

      {state.status === "error" && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          <p className="font-semibold">
            Couldn&apos;t load {title.toLowerCase()}.
          </p>
          <p className="mt-1">{state.message}</p>
        </div>
      )}

      {state.status === "success" &&
        (state.response.data.length === 0 ? (
          <p className="rounded-md bg-zinc-50 p-4 text-sm text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            No {title.toLowerCase()} returned by the API (empty response
            handled).
          </p>
        ) : (
          <div>
            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
              Showing {state.response.data.length} of{" "}
              {state.response.meta.total} (page{" "}
              {state.response.meta.current_page} of{" "}
              {state.response.meta.last_page})
            </p>
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {state.response.data.map((item, index) => (
                <li key={index} className="py-2 text-sm">
                  {renderItem(item)}
                  {renderMeta?.(item) && (
                    <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {renderMeta(item)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
    </section>
  );
}

export default async function ApiStatusPage() {
  // no-store: this is a live integration check, always hit Laravel directly.
  const fetchOpts = { cache: "no-store" as const };

  const [loc, proj, fac, ann, src] = await Promise.allSettled([
    getLocations({ per_page: 5 }, fetchOpts),
    getProjects({ per_page: 5 }, fetchOpts),
    getFacilities({ per_page: 5 }, fetchOpts),
    getAnnouncements({ per_page: 5 }, fetchOpts),
    getDataSources({ per_page: 5 }, fetchOpts),
  ]);

  const locations = settle<Location>(loc);
  const projects = settle<Project>(proj);
  const facilities = settle<Facility>(fac);
  const announcements = settle<Announcement>(ann);
  const dataSources = settle<DataSource>(src);

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 font-sans dark:bg-black">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-10">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              API Status
            </h1>
            <RefreshButton />
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Live connectivity check between the frontend and the Laravel REST
            API. Each card fetches independently so failures are isolated per
            resource.
          </p>
          <p className="mt-2 font-mono text-xs text-zinc-500 dark:text-zinc-400">
            API base: {API_BASE_URL}
          </p>
        </div>

        <Section<Location>
          title="Locations"
          endpoint="/locations"
          state={locations}
          renderItem={(l) => (
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {l.name}
            </span>
          )}
          renderMeta={(l) =>
            [l.barangay, l.location_type].filter(Boolean).join(" · ") || null
          }
        />

        <Section<Project>
          title="Projects"
          endpoint="/projects"
          state={projects}
          renderItem={(p) => (
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {p.title}
            </span>
          )}
          renderMeta={(p) => `${p.status} · ${p.completion_percentage}%`}
        />

        <Section<Facility>
          title="Facilities"
          endpoint="/facilities"
          state={facilities}
          renderItem={(f) => (
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {f.name}
            </span>
          )}
          renderMeta={(f) => f.category}
        />

        <Section<Announcement>
          title="Announcements"
          endpoint="/announcements"
          state={announcements}
          renderItem={(a) => (
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {a.title}
            </span>
          )}
          renderMeta={(a) => `${a.category} · ${a.status}`}
        />

        <Section<DataSource>
          title="Data Sources"
          endpoint="/data-sources"
          state={dataSources}
          renderItem={(d) => (
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {d.name}
            </span>
          )}
          renderMeta={(d) => d.source_type}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
