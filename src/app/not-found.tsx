import Link from "next/link";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { buttonClasses } from "@/components/ui/button";

/** Branded 404 rendered by `notFound()` (e.g. unknown record ids). */
export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 font-sans dark:bg-black">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-700 dark:text-blue-400">
          Not found
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          This page doesn&apos;t exist
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          The record you&apos;re looking for may have been removed or the link
          is incorrect.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/map" className={buttonClasses("primary")}>
            Open LifeMap
          </Link>
          <Link href="/" className={buttonClasses("secondary")}>
            Back to Home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
