"use client";

import { useThemeOptional } from "@/components/theme-provider";

/**
 * Compact Light/Dark switch for authenticated scopes only.
 *
 * Renders nothing outside a ScopedThemeProvider, so public pages can
 * include headers that reference it without ever showing a toggle.
 */
export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const themeContext = useThemeOptional();
  if (!themeContext) return null;

  const { theme, toggleTheme } = themeContext;
  const dark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={dark}
      aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
      title={`Switch to ${dark ? "light" : "dark"} mode`}
      className={`inline-flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-slate-600 transition-colors duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:bg-slate-800 dark:hover:text-blue-200 ${compact ? "w-10 px-0" : "px-3"}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[18px] w-[18px] shrink-0 transition-transform duration-200"
      >
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
          </>
        ) : (
          <>
            <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
            <path d="M16 3v4m-2-2h4" />
          </>
        )}
      </svg>
      {!compact && <span className="text-xs font-semibold">{dark ? "Light" : "Dark"}</span>}
    </button>
  );
}
