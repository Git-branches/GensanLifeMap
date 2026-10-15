import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import BrandLogo from "@/components/brand-logo";

const POINTS = [
  "Report an issue to the city and follow its review",
  "Browse public projects, facilities and announcements",
  "Your account is used only for community reports",
];

/**
 * Light-only auth layout shared by /login and /register: a photo panel
 * on large screens beside the form card. No theme provider, no
 * dark-mode toggle — the UX stays deterministic.
 */
export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-dvh flex-1 bg-[#f3f7fb] text-slate-800 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]" style={{ colorScheme: "light" }}>
      <aside className="relative isolate hidden overflow-hidden bg-blue-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Image src="/images/landing/gensan.jpg" alt="" fill priority sizes="42vw" className="-z-20 object-cover" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-slate-950/55" />
        <Link href="/" className="flex w-fit items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" aria-label="GenSan LifeMap home">
          <BrandLogo size={48} />
          <span className="leading-tight"><span className="block text-sm font-bold tracking-wide text-white">GenSan LifeMap</span><span className="block text-xs text-blue-100">City of General Santos</span></span>
        </Link>
        <div>
          <h2 className="max-w-md font-display text-4xl font-bold leading-tight tracking-tight text-white">A clearer view of the city you live in.</h2>
          <ul className="mt-6 space-y-3">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm leading-6 text-white">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="flex items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-6 flex w-fit items-center gap-3 lg:hidden" aria-label="GenSan LifeMap home">
            <BrandLogo size={44} />
            <span><span className="block text-sm font-bold tracking-wide text-slate-900">GenSan LifeMap</span><span className="block text-xs text-slate-500">City of General Santos</span></span>
          </Link>
          <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">{children}</section>
          <p className="mt-5 text-center text-xs text-slate-500"><Link href="/" className="hover:text-blue-700 hover:underline">← Back to GenSan LifeMap</Link></p>
        </div>
      </div>
    </main>
  );
}
