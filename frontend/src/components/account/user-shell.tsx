"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import ThemeToggle from "@/components/theme-toggle";
import {
  CloseIcon,
  DocIcon,
  FlagIcon,
  GridIcon,
  LogoutIcon,
  MapIcon,
  MenuIcon,
  PinIcon,
  UsersIcon,
} from "@/components/ui/icons";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const GROUPS: { title: string; links: NavItem[] }[] = [
  { title: "Workspace", links: [{ href: "/dashboard", label: "Dashboard", icon: <GridIcon /> }] },
  {
    title: "Community reports",
    links: [
      { href: "/reports", label: "My reports", icon: <DocIcon /> },
      { href: "/reports/new", label: "Submit a report", icon: <FlagIcon /> },
    ],
  },
  { title: "Account", links: [{ href: "/profile", label: "My profile", icon: <UsersIcon /> }] },
  {
    title: "Explore",
    links: [
      { href: "/lifemap", label: "LifeMap", icon: <MapIcon /> },
      { href: "/", label: "Public website", icon: <PinIcon /> },
    ],
  },
];

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700";

function BrandMark() {
  return (
    <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm shadow-blue-950/15">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z" stroke="currentColor" strokeWidth="1.7" /><circle cx="12" cy="9" r="2.2" fill="currentColor" /></svg>
    </span>
  );
}

/**
 * Resident workspace shell: the signed-in counterpart of the admin
 * shell. A fixed sidebar groups the resident's own destinations so the
 * public site header/footer are no longer part of the account area.
 */
export default function UserShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [status, router, pathname]);

  if (status !== "authenticated" || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f3f7fb] text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
        <span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700" />
        Checking your account…
      </div>
    );
  }

  const isActive = (href: string) => pathname === href;
  const current = GROUPS.flatMap((group) => group.links).find((item) => isActive(item.href));
  const isStaff = user.role === "admin" || user.role === "moderator";

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
      router.replace("/");
      router.refresh();
    }
  }

  const itemClass = (active: boolean) =>
    `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${FOCUS} ${active ? "bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-100 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"}`;

  const nav = (onNavigate?: () => void) => (
    <div className="space-y-6">
      {GROUPS.map((group) => (
        <div key={group.title}>
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{group.title}</p>
          <ul className="mt-2 space-y-1">
            {group.links.map((item) => (
              <li key={item.href}>
                <Link href={item.href} onClick={onNavigate} aria-current={isActive(item.href) ? "page" : undefined} className={itemClass(isActive(item.href))}>
                  <span aria-hidden="true" className="shrink-0">{item.icon}</span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                </Link>
              </li>
            ))}
            {group.title === "Account" && isStaff && (
              <li>
                <Link href="/admin" onClick={onNavigate} className={itemClass(false)}>
                  <span aria-hidden="true" className="shrink-0"><GridIcon /></span>
                  <span className="min-w-0 flex-1 truncate">Management workspace</span>
                </Link>
              </li>
            )}
          </ul>
        </div>
      ))}
    </div>
  );

  const initial = user.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex min-h-dvh flex-col bg-[#f3f7fb] font-sans text-slate-800 dark:bg-slate-950 dark:text-slate-200 lg:flex-row">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <Link href="/" aria-label="GenSan LifeMap public website" className={`flex shrink-0 items-center gap-3 border-b border-slate-100 px-5 py-[18px] dark:border-slate-800 ${FOCUS}`}>
          <BrandMark />
          <span className="min-w-0">
            <span className="block text-[13px] font-extrabold tracking-[0.06em] text-slate-900 dark:text-slate-100">GENSAN LIFE MAP</span>
            <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">Resident workspace</span>
          </span>
        </Link>
        <nav aria-label="Account" className="min-h-0 flex-1 overflow-y-auto px-3 py-5">{nav()}</nav>
        <div className="m-3 mt-0 shrink-0 rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">{initial}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{user.name}</span>
              <span className="mt-0.5 block truncate text-[11px] capitalize text-slate-500 dark:text-slate-400">{user.role}</span>
            </span>
          </div>
          <button type="button" onClick={() => void handleSignOut()} disabled={signingOut} className={`mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 ${FOCUS}`}>
            <LogoutIcon />{signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-200/90 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen} aria-controls="mobile-account-nav" aria-label={mobileOpen ? "Close menu" : "Open menu"} className={`rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden ${FOCUS}`}>
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
            <span className="lg:hidden"><BrandMark /></span>
            <div className="min-w-0 text-sm">
              <span className="hidden text-slate-500 dark:text-slate-400 sm:inline">My workspace <span className="mx-1 text-slate-300 dark:text-slate-600">/</span></span>
              <span className="truncate font-semibold text-slate-900 dark:text-slate-100">{current?.label ?? "Dashboard"}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/reports/new" className={`hidden min-h-10 items-center gap-2 rounded-full bg-blue-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-800 sm:inline-flex ${FOCUS}`}>
              <FlagIcon /> Submit a report
            </Link>
            <ThemeToggle compact />
            <Link href="/profile" aria-label="My profile" className={`flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white ${FOCUS}`}>{initial}</Link>
          </div>
        </header>

        {mobileOpen && (
          <nav id="mobile-account-nav" aria-label="Account mobile" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:hidden">
            {nav(() => setMobileOpen(false))}
            <button type="button" onClick={() => void handleSignOut()} disabled={signingOut} className="mt-5 min-h-11 w-full rounded-lg border border-rose-200 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-slate-800">
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </nav>
        )}

        <main className="w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        <footer className="px-4 pb-6 text-center text-xs text-slate-500 dark:text-slate-400">GenSan LifeMap · General Santos City</footer>
      </div>
    </div>
  );
}
