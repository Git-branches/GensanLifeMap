"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ColorTheme = "light" | "dark";
export type ThemeScope = "user" | "admin";

interface ThemeContextValue {
  scope: ThemeScope;
  theme: ColorTheme;
  toggleTheme: () => void;
}

const STORAGE_KEYS: Record<ThemeScope, string> = {
  user: "glm-user-theme",
  admin: "glm-admin-theme",
};

/** Retired global key — only read once to migrate returning visitors. */
const LEGACY_STORAGE_KEY = "glm-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(scope: ThemeScope): ColorTheme {
  if (typeof window === "undefined") return "light";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEYS[scope]);
    if (saved === "dark" || saved === "light") return saved;
    // One-time migration from the retired global key.
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy === "dark" || legacy === "light") {
      window.localStorage.setItem(STORAGE_KEYS[scope], legacy);
      return legacy;
    }
  } catch {
    /* Storage unavailable — fall through to the default. */
  }
  return "light";
}

/**
 * Scoped theme provider.
 *
 * The `dark` class is applied ONLY to this provider's own wrapper
 * (`div.glm-theme-scope`), so dark styles (Tailwind `dark:` utilities and
 * the remaps in globals.css) can never leak into the public pages, which
 * render without any theme scope and therefore always stay in light mode.
 *
 * User and admin scopes use separate localStorage keys, so the two
 * preferences persist independently and never interfere with each other.
 */
export function ScopedThemeProvider({
  scope,
  children,
}: {
  scope: ThemeScope;
  children: ReactNode;
}) {
  // Always render "light" on the first pass so the client HTML matches
  // the SSR output. The stored preference is synced after hydration (see
  // below). Public pages render no scope at all, so they are unaffected.
  const [theme, setTheme] = useState<ColorTheme>("light");

  useEffect(() => {
    const stored = readStoredTheme(scope);
    // Intentional post-hydration sync from localStorage: the first render
    // must stay "light" to match the server and avoid a hydration error.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(stored);
  }, [scope]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: ColorTheme = current === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(STORAGE_KEYS[scope], next);
      } catch {
        /* Keep this tab's theme if storage is unavailable. */
      }
      return next;
    });
  }, [scope]);

  const value = useMemo(() => ({ scope, theme, toggleTheme }), [scope, theme, toggleTheme]);
  const dark = theme === "dark";

  return (
    <ThemeContext.Provider value={value}>
      <div
        data-theme-scope={scope}
        data-theme={theme}
        className={`glm-theme-scope flex min-h-full flex-1 flex-col${dark ? " dark" : ""}`}
        style={{ colorScheme: dark ? "dark" : "light" }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used within ScopedThemeProvider.");
  return value;
}

/** Null-safe variant: returns null outside a theme scope (e.g. public pages). */
export function useThemeOptional(): ThemeContextValue | null {
  return useContext(ThemeContext);
}

/**
 * Backwards-compatible export. Intentionally light-only: it renders no
 * theme scope and never applies the `dark` class, so legacy usages cannot
 * darken public pages. Prefer `ScopedThemeProvider` with an explicit scope.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
