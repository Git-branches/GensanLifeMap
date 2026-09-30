"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./auth-provider";
import ThemeToggle from "@/components/theme-toggle";
import { buttonClasses } from "./ui/button";
import { CloseIcon, MenuIcon, SearchIcon } from "./ui/icons";

const LINKS = [
  { href: "/lifemap", label: "Explore" },
  { href: "/locations", label: "Locations" },
  { href: "/projects", label: "Projects" },
  { href: "/facilities", label: "Facilities" },
  { href: "/announcements", label: "Announcements" },
  { href: "/about", label: "About" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { status, user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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

  const linkClass = (href: string) =>
    `rounded-full px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${pathname === href || pathname.startsWith(`${href}/`) ? "bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"}`;

  // The theme toggle lives only inside the authenticated user scope:
  // public pages render without a theme provider, so nothing shows there.
  const showThemeToggle = status === "authenticated" && user !== null;

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-slate-200 bg-white/95 text-slate-800 shadow-sm backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-200">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="GenSan LifeMap home">
          <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 17.5S4 11.8 4 7.5a6 6 0 1 1 12 0c0 4.3-6 10-6 10Z" stroke="currentColor" strokeWidth="1.6"/><circle cx="10" cy="7.5" r="2" fill="currentColor"/></svg>
          </span>
          <span className="leading-tight"><span className="block text-sm font-bold tracking-wide text-slate-900 dark:text-slate-100">GENSAN</span><span className="block text-[10px] font-semibold tracking-[0.18em] text-blue-700 dark:text-blue-400">LIFE MAP</span></span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
          {LINKS.map((item) => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className={linkClass(item.href)}>{item.label}</Link>)}
        </nav>

        <div className="flex items-center gap-2">
          {showThemeToggle && <ThemeToggle compact />}
          <Link href="/lifemap" aria-label="Search the LifeMap" className="rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300"><SearchIcon /></Link>
          {status === "authenticated" && user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/reports" className="rounded-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">My reports</Link>
              {(user.role === "admin" || user.role === "moderator") && <Link href="/admin" className="rounded-full px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-slate-800">Management</Link>}
              <Link href="/profile" className="max-w-32 truncate rounded-full px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">{user.name.split(" ")[0]}</Link>
              <button type="button" onClick={() => void handleSignOut()} disabled={signingOut} className="rounded-full px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800">{signingOut ? "Signing outâ€¦" : "Sign out"}</button>
            </div>
          ) : status === "unauthenticated" ? <Link href="/login" className="hidden rounded-full px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:inline-flex dark:text-slate-200 dark:hover:bg-slate-800">Sign in</Link> : null}
          <Link href="/lifemap" className={`${buttonClasses("primary", "sm")} hidden sm:inline-flex`}>Explore LifeMap</Link>
          <button type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-controls="mobile-nav" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800">{menuOpen ? <CloseIcon /> : <MenuIcon />}</button>
        </div>
      </div>

      {menuOpen && <nav id="mobile-nav" aria-label="Mobile" className="border-t border-slate-200 bg-white px-4 py-3 shadow-lg dark:border-slate-800 dark:bg-slate-950 lg:hidden"><ul className="mx-auto flex max-w-6xl flex-col gap-1">{LINKS.map((item) => <li key={item.href}><Link href={item.href} onClick={() => setMenuOpen(false)} aria-current={pathname === item.href ? "page" : undefined} className="block min-h-11 rounded-lg px-3 py-2.5 text-base font-medium text-slate-700 hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-slate-900">{item.label}</Link></li>)}<li className="mt-1"><Link href="/lifemap" onClick={() => setMenuOpen(false)} className="block min-h-11 rounded-full bg-blue-700 px-4 py-2.5 text-center text-base font-semibold text-white">Explore LifeMap</Link></li>{status === "authenticated" && user ? <><li><Link href="/reports" onClick={() => setMenuOpen(false)} className="block min-h-11 rounded-lg px-3 py-2.5 font-medium text-slate-700 dark:text-slate-200">My reports</Link></li>{(user.role === "admin" || user.role === "moderator") && <li><Link href="/admin" onClick={() => setMenuOpen(false)} className="block min-h-11 rounded-lg px-3 py-2.5 font-semibold text-blue-800 dark:text-blue-300">Management workspace</Link></li>}<li><Link href="/profile" onClick={() => setMenuOpen(false)} className="block min-h-11 rounded-lg px-3 py-2.5 font-medium text-slate-700 dark:text-slate-200">Profile Â· {user.name}</Link></li><li><button type="button" onClick={() => void handleSignOut()} className="min-h-11 px-3 text-left font-medium text-slate-600 dark:text-slate-300">{signingOut ? "Signing outâ€¦" : "Sign out"}</button></li></> : <li><Link href="/login" onClick={() => setMenuOpen(false)} className="block min-h-11 rounded-lg px-3 py-2.5 font-medium text-slate-700 dark:text-slate-200">Sign in / Create account</Link></li>}{showThemeToggle && <li className="flex items-center justify-between border-t border-slate-100 px-3 pt-3 dark:border-slate-800"><span className="text-sm text-slate-600 dark:text-slate-300">Appearance</span><ThemeToggle /></li>}</ul></nav>}
    </header>
  );
}
