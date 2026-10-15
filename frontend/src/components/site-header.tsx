"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "./auth-provider";
import AuthModal from "./auth-modal";
import BrandLogo from "./brand-logo";
import { useThemeOptional } from "@/components/theme-provider";
import ThemeToggle from "@/components/theme-toggle";
import { buttonClasses } from "./ui/button";
import {
  ChevronDownIcon,
  CloseIcon,
  DocIcon,
  FlagIcon,
  GridIcon,
  MenuIcon,
  SearchIcon,
  ShieldIcon,
  UsersIcon,
} from "./ui/icons";
import type { AuthUser } from "@/types/user";

const LINKS = [
  { href: "/lifemap", label: "Explore" },
  { href: "/locations", label: "Locations" },
  { href: "/projects", label: "Projects" },
  { href: "/facilities", label: "Facilities" },
  { href: "/announcements", label: "Announcements" },
  { href: "/about", label: "About" },
];

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700";

interface AccountLink {
  href: string;
  label: string;
  icon: ReactNode;
}

/** Account destinations shared by the desktop menu and the mobile drawer. */
function accountLinks(user: AuthUser): AccountLink[] {
  const links: AccountLink[] = [
    { href: "/dashboard", label: "My dashboard", icon: <GridIcon /> },
    { href: "/reports", label: "My reports", icon: <DocIcon /> },
    { href: "/reports/new", label: "Submit a report", icon: <FlagIcon /> },
    { href: "/profile", label: "My profile", icon: <UsersIcon /> },
  ];
  if (user.role === "admin" || user.role === "moderator") {
    links.push({ href: "/admin", label: "Management workspace", icon: <ShieldIcon /> });
  }
  return links;
}

function Avatar({ user, size = "md" }: { user: AuthUser; size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-blue-700 font-bold text-white ${size === "sm" ? "h-8 w-8 text-sm" : "h-10 w-10 text-base"}`}
    >
      {user.name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

function AccountSummary({ user }: { user: AuthUser }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar user={user} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
      </div>
      <span className="ml-auto shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold capitalize text-blue-800 ring-1 ring-inset ring-blue-100 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-900">
        {user.role}
      </span>
    </div>
  );
}

function AccountMenu({
  user,
  pathname,
  signingOut,
  onSignOut,
}: {
  user: AuthUser;
  pathname: string;
  signingOut: boolean;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hasTheme = useThemeOptional() !== null;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const firstName = user.name.trim().split(/\s+/)[0] || user.name;

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="account-menu"
        aria-haspopup="true"
        className={`flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 ${FOCUS}`}
      >
        <Avatar user={user} size="sm" />
        <span className="max-w-28 truncate">{firstName}</span>
        <span aria-hidden="true" className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}><ChevronDownIcon /></span>
      </button>

      {open && (
        <div
          id="account-menu"
          className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="border-b border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <AccountSummary user={user} />
          </div>
          <ul className="p-2">
            {accountLinks(user).map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${active ? "bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200" : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"} ${FOCUS}`}
                  >
                    <span aria-hidden="true" className="text-slate-500 dark:text-slate-400">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          {hasTheme && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-2.5 dark:border-slate-800">
              <span className="text-sm text-slate-600 dark:text-slate-300">Appearance</span>
              <ThemeToggle />
            </div>
          )}
          <div className="border-t border-slate-100 p-2 dark:border-slate-800">
            <button
              type="button"
              onClick={onSignOut}
              disabled={signingOut}
              className={`flex min-h-11 w-full items-center rounded-lg px-3 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50 dark:text-rose-300 dark:hover:bg-slate-800 ${FOCUS}`}
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { status, user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const hasTheme = useThemeOptional() !== null;

  if (pathname.startsWith("/admin")) return null;

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
      setMenuOpen(false);
      router.push("/");
      router.refresh();
    }
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const linkClass = (href: string) =>
    `rounded-full px-3 py-2 text-sm font-medium transition-colors ${FOCUS} ${isActive(href) ? "bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"}`;

  const account = status === "authenticated" && user ? user : null;

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-slate-200 bg-white/95 text-slate-800 shadow-sm backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-200">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="GenSan LifeMap home">
          <BrandLogo size={40} />
          <span className="leading-tight"><span className="block text-sm font-bold tracking-wide text-slate-900 dark:text-slate-100">GENSAN</span><span className="block text-[10px] font-semibold tracking-[0.18em] text-blue-700 dark:text-blue-400">LIFE MAP</span></span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
          {LINKS.map((item) => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className={linkClass(item.href)}>{item.label}</Link>)}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/lifemap" aria-label="Search the LifeMap" className={`rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-blue-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300 ${FOCUS}`}><SearchIcon /></Link>

          {account ? (
            <>
              <Link href="/reports/new" className={`${buttonClasses("primary", "sm")} hidden md:inline-flex`}>Submit a report</Link>
              <div className="hidden sm:block">
                <AccountMenu user={account} pathname={pathname} signingOut={signingOut} onSignOut={() => void handleSignOut()} />
              </div>
            </>
          ) : (
            <>
              {status === "unauthenticated" && <button type="button" onClick={() => setLoginOpen(true)} aria-haspopup="dialog" className={`hidden rounded-full px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:inline-flex dark:text-slate-200 dark:hover:bg-slate-800 ${FOCUS}`}>Sign in</button>}
              <Link href="/lifemap" className={`${buttonClasses("primary", "sm")} hidden sm:inline-flex`}>Explore LifeMap</Link>
            </>
          )}

          <button type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-controls="mobile-nav" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} className={`rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800 ${FOCUS}`}>{menuOpen ? <CloseIcon /> : <MenuIcon />}</button>
        </div>
      </div>

      {menuOpen && (
        <nav id="mobile-nav" aria-label="Mobile" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-slate-200 bg-white px-4 py-4 shadow-lg dark:border-slate-800 dark:bg-slate-950 lg:hidden">
          <div className="mx-auto max-w-6xl space-y-4">
            {account && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <AccountSummary user={account} />
              </div>
            )}

            <ul className="flex flex-col gap-1">
              {LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} onClick={() => setMenuOpen(false)} aria-current={pathname === item.href ? "page" : undefined} className={`block min-h-11 rounded-lg px-3 py-2.5 text-base font-medium ${isActive(item.href) ? "bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200" : "text-slate-700 hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-slate-900"}`}>{item.label}</Link>
                </li>
              ))}
            </ul>

            {account ? (
              <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                <p className="px-3 pb-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Your account</p>
                <ul className="flex flex-col gap-1">
                  {accountLinks(account).map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} onClick={() => setMenuOpen(false)} aria-current={pathname === item.href ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium ${pathname === item.href ? "bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200" : "text-slate-700 hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-slate-900"}`}>
                        <span aria-hidden="true" className="text-slate-500 dark:text-slate-400">{item.icon}</span>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                {hasTheme && (
                  <div className="mt-2 flex items-center justify-between px-3 py-2">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Appearance</span>
                    <ThemeToggle />
                  </div>
                )}
                <button type="button" onClick={() => void handleSignOut()} disabled={signingOut} className="mt-2 min-h-11 w-full rounded-lg border border-rose-200 px-3 text-base font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-slate-900">
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            ) : (
              <div className="grid gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <Link href="/lifemap" onClick={() => setMenuOpen(false)} className="block min-h-11 rounded-full bg-blue-700 px-4 py-2.5 text-center text-base font-semibold text-white">Explore LifeMap</Link>
                {status === "unauthenticated" && <button type="button" onClick={() => { setMenuOpen(false); setLoginOpen(true); }} aria-haspopup="dialog" className="block min-h-11 rounded-full border border-slate-300 px-4 py-2.5 text-center text-base font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">Sign in / Create account</button>}
              </div>
            )}
          </div>
        </nav>
      )}
      {loginOpen && <AuthModal onClose={() => setLoginOpen(false)} />}
    </header>
  );
}
