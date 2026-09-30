import Link from "next/link";
import type { ReactNode } from "react";
import ThemeToggle from "@/components/theme-toggle";
import { ScopedThemeProvider, type ThemeScope } from "@/components/theme-provider";

export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  switchPrompt,
  themeScope = "user",
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  switchPrompt: ReactNode;
  /** Which persisted theme this login surface reads/writes. Defaults to "user". */
  themeScope?: ThemeScope;
}) {
  return (
    <ScopedThemeProvider key={themeScope} scope={themeScope}>
      <main className="flex min-h-full flex-1 items-center justify-center bg-slate-50 px-4 py-10 transition-colors sm:py-14 dark:bg-slate-950">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-between"><Link href="/" className="flex items-center gap-2.5" aria-label="GenSan LifeMap home">
            <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 17.5S4 11.8 4 7.5a6 6 0 1 1 12 0c0 4.3-6 10-6 10Z" stroke="currentColor" strokeWidth="1.6"/><circle cx="10" cy="7.5" r="2" fill="currentColor"/></svg>
            </span>
            <span><span className="block text-sm font-bold tracking-wide text-slate-900 dark:text-slate-100">GenSan LifeMap</span><span className="block text-xs text-slate-500 dark:text-slate-400">General Santos City</span></span>
          </Link><ThemeToggle /></div>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">{eyebrow}</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{subtitle}</p>
            <div className="mt-6">{children}</div>
            <p className="mt-6 border-t border-slate-100 pt-4 text-center text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">{switchPrompt}</p>
            <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400"><Link href="/" className="hover:text-blue-700 hover:underline dark:hover:text-blue-300">← Back to GenSan LifeMap</Link></p>
          </section>
        </div>
      </main>
    </ScopedThemeProvider>
  );
}
