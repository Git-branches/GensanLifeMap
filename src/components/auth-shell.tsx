import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared layout for authentication screens (sign in / create account).
 * Phase 5 visual language: deep-navy geography panel with General
 * Santos coastline imagery beside a white form card. Stacks on mobile
 * with the imagery as a compact top banner.
 */
export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  switchPrompt,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  switchPrompt: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#071425] font-sans">
      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-0 px-4 py-8 sm:py-12 lg:grid-cols-2 lg:gap-8">
        <div className="relative min-h-44 overflow-hidden rounded-t-2xl lg:min-h-0 lg:rounded-2xl">
          <Image
            src="/images/landing/gensan.jpg"
            alt="Aerial view of the General Santos City coastline"
            fill
            priority
            className="object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#071425] via-[#071425]/45 to-[#071425]/10 lg:bg-gradient-to-r lg:from-[#071425]/30 lg:via-transparent lg:to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
              General Santos City
            </p>
            <p className="mt-1 max-w-sm text-xl font-bold leading-snug text-white sm:text-2xl">
              Know your city. Explore General Santos.
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-b-2xl bg-white p-6 dark:bg-zinc-950 sm:p-8 lg:rounded-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-400">
            {eyebrow}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {title}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {subtitle}
          </p>
          <div className="mt-6">{children}</div>
          <p className="mt-6 border-t border-zinc-200 pt-4 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
            {switchPrompt}
          </p>
          <p className="mt-3 text-center text-xs text-zinc-500 dark:text-zinc-500">
            <Link href="/" className="hover:underline">
              ← Back to GenSan LifeMap home
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
