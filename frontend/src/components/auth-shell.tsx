import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Light-only auth shell. No theme provider, no dark-mode toggle, no
 * `dark:` variants — sign-in / register always render in the light
 * admin-dashboard palette so the UX is deterministic.
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
    <main
      className="flex min-h-full flex-1 items-center justify-center bg-[#f3f7fb] px-4 py-10 text-slate-800 sm:py-14"
      style={{ colorScheme: "light" }}
    >
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between"><Link href="/" className="flex items-center gap-2.5" aria-label="GenSan LifeMap home">
          <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm shadow-blue-950/15">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 17.5S4 11.8 4 7.5a6 6 0 1 1 12 0c0 4.3-6 10-6 10Z" stroke="currentColor" strokeWidth="1.6"/><circle cx="10" cy="7.5" r="2" fill="currentColor"/></svg>
          </span>
          <span><span className="block text-sm font-bold tracking-wide text-slate-900">GenSan LifeMap</span><span className="block text-xs text-slate-500">General Santos City</span></span>
        </Link></div>
        <section className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-blue-800"><span className="h-1.5 w-1.5 rounded-full bg-teal-500" aria-hidden="true" />{eyebrow}</p>
          <h1 className="mt-2 text-[26px] font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 text-[13px] leading-5 text-slate-600">{subtitle}</p>
          <div className="mt-6">{children}</div>
          <p className="mt-6 border-t border-slate-100 pt-4 text-center text-sm text-slate-600">{switchPrompt}</p>
          <p className="mt-3 text-center text-xs text-slate-500"><Link href="/" className="hover:text-blue-700 hover:underline">← Back to GenSan LifeMap</Link></p>
        </section>
      </div>
    </main>
  );
}
