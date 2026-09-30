import SiteHeader from "@/components/site-header";
import { Skeleton } from "@/components/ui/states";

/**
 * Loading state for /map while the Server Component awaits the Laravel API.
 */
export default function MapLoading() {
  return (
    <div className="flex h-dvh flex-col bg-zinc-50 font-sans dark:bg-black">
      <SiteHeader />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex min-h-0 flex-1 flex-col space-y-3 p-4 lg:w-[380px] lg:flex-none">
          <Skeleton className="h-10 rounded-lg!" />
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full!" />
            ))}
          </div>
          {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 rounded-lg!" />
          ))}
        </div>
        <div
          aria-label="Map loading"
          className="flex h-[44dvh] shrink-0 items-center justify-center bg-zinc-100 dark:bg-zinc-900 lg:h-auto lg:flex-1"
        >
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Loading interactive map…
          </p>
        </div>
      </div>
    </div>
  );
}
