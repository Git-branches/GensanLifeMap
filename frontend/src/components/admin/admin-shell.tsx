"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import ThemeToggle from "@/components/theme-toggle";

type NavigationGroup = { title: string; links: { href: string; label: string; icon: string }[] };

const ADMIN_LINKS: NavigationGroup[] = [
  { title: "Workspace", links: [{ href: "/admin", label: "Dashboard", icon: "grid" }] },
  { title: "City information", links: [{ href: "/admin/locations", label: "Locations", icon: "pin" }, { href: "/admin/projects", label: "Projects", icon: "layers" }, { href: "/admin/facilities", label: "Facilities", icon: "building" }] },
  { title: "Community", links: [{ href: "/admin/community-reports", label: "Reports", icon: "report" }, { href: "/admin/announcements", label: "Announcements", icon: "notice" }] },
  { title: "Governance", links: [{ href: "/admin/data-sources", label: "Data sources", icon: "database" }, { href: "/admin/audit-logs", label: "Audit trail", icon: "clock" }, { href: "/admin/users", label: "User accounts", icon: "users" }] },
];
const MODERATOR_LINKS: NavigationGroup[] = [
  { title: "Workspace", links: [{ href: "/admin", label: "Dashboard", icon: "grid" }] },
  { title: "Community", links: [{ href: "/admin/community-reports", label: "Reports", icon: "report" }] },
];

const GLYPHS: Record<string, string> = {
  grid: "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z",
  pin: "M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z M12 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  layers: "m12 3 9 5-9 5-9-5 9-5Z M3 12l9 5 9-5 M3 16l9 5 9-5",
  building: "M3 21h18 M5 21V5l7-3 7 3v16 M9 9h.01 M15 9h.01 M9 13h.01 M15 13h.01 M10 21v-4h4v4",
  report: "M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8l-5-5H8Z M14 3v6h7 M7 13h10 M7 17h7",
  notice: "M4 5h16v14H4z M8 9h8 M8 13h8 M8 17h4 M8 2v6 M16 2v6",
  database: "M12 3c-4.4 0-8 1.3-8 3v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6c0-1.7-3.6-3-8-3Z M4 6c0 1.7 3.6 3 8 3s8-1.3 8-3 M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M12 6v6l4 2",
  users: "M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M20 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8",
};

function NavIcon({ name }: { name: string }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0"><path d={GLYPHS[name] ?? GLYPHS.grid} /></svg>;
}

function BrandMark() {
  return <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm shadow-blue-950/15"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z" stroke="currentColor" strokeWidth="1.7"/><circle cx="12" cy="9" r="2.2" fill="currentColor"/></svg></span>;
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    if (status === "authenticated" && user?.role !== "admin" && user?.role !== "moderator") router.replace("/");
  }, [status, user, router, pathname]);

  if (status !== "authenticated" || (user?.role !== "admin" && user?.role !== "moderator")) {
    return <div className="flex min-h-dvh items-center justify-center bg-[#f3f7fb] text-sm text-slate-600"><span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700" />Checking staff access…</div>;
  }

  const groups = user.role === "admin" ? ADMIN_LINKS : MODERATOR_LINKS;
  const currentLink = groups.flatMap((group) => group.links).find((item) => item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href));
  const isActive = (href: string) => href === "/admin" ? pathname === href : pathname.startsWith(href);

  async function handleLogout() {
    setSigningOut(true);
    try { await signOut(); } finally { setSigningOut(false); router.replace("/"); router.refresh(); }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#f3f7fb] text-slate-800 transition-colors lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:flex-row dark:bg-slate-950 dark:text-slate-200">
      <aside className="hidden w-[264px] shrink-0 border-r border-slate-200/90 bg-white lg:flex lg:h-full lg:flex-col dark:border-slate-800 dark:bg-slate-900">
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-5 py-[18px] dark:border-slate-800"><BrandMark /><div className="min-w-0"><p className="text-[13px] font-extrabold tracking-[0.06em] text-slate-900 dark:text-slate-100">GENSAN LIFE MAP</p><p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">City information system</p></div></div>
        <div className="px-5 pb-1 pt-5"><div className="rounded-lg bg-[#f5f8fc] px-3 py-2.5 dark:bg-slate-800"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">Workspace</p><p className="mt-1 truncate text-xs font-semibold text-slate-700 dark:text-slate-200">General Santos City</p></div></div>
        <nav aria-label="Administration" className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-5">{groups.map((group) => <div key={group.title}><p className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{group.title}</p><ul className="mt-2 space-y-1">{group.links.map((item) => <li key={item.href}><Link href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={`group flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors ${isActive(item.href) ? "bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-100 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"}`}><NavIcon name={item.icon} /><span className="min-w-0 flex-1 truncate">{item.label}</span>{item.href === "/admin/community-reports" && <span className="h-1.5 w-1.5 rounded-full bg-teal-500" aria-hidden="true" />}</Link></li>)}</ul></div>)}<div><p className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Account</p><ul className="mt-2 space-y-1"><li><Link href="/profile" className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"><NavIcon name="users" />My account</Link></li><li><Link href="/" className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"><NavIcon name="pin" />Public website</Link></li></ul></div></nav>
        <div className="m-3 mt-0 shrink-0 rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800"><div className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-200">{user.name.trim().charAt(0).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{user.name}</span><span className="mt-0.5 block text-[10px] capitalize text-slate-500 dark:text-slate-400">{user.role === "admin" ? "Administrator" : "Moderator"}</span></span></div></div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:h-full lg:min-h-0">
        <header className="sticky top-0 z-30 flex min-h-[68px] shrink-0 items-center justify-between border-b border-slate-200/90 bg-white px-4 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setMobileOpen((open) => !open)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 lg:hidden dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" aria-expanded={mobileOpen} aria-controls="mobile-admin-nav"><span className="text-base leading-none">☰</span>Menu</button>
            <span className="lg:hidden"><BrandMark /></span>
            <div className="min-w-0"><div className="flex items-center gap-2 text-xs text-slate-500"><span className="hidden sm:inline">Management</span><span className="hidden text-slate-300 sm:inline">/</span><span className="truncate font-semibold text-slate-800">{currentLink?.label ?? "Dashboard"}</span></div><p className="mt-0.5 hidden text-[11px] text-slate-400 sm:block">General Santos City · LGU workspace</p></div>
          </div>
          <div className="ml-3 flex shrink-0 items-center gap-2 sm:gap-3"><div className="hidden items-center gap-2 sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-500" /><span className="text-[11px] font-medium text-slate-500">Staff session</span></div><ThemeToggle compact /><button type="button" onClick={() => void handleLogout()} disabled={signingOut} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M10 17l5-5-5-5M15 12H3 M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></svg>{signingOut ? "Signing out" : "Sign out"}</button></div>
        </header>
        {mobileOpen && <div id="mobile-admin-nav" className="z-20 border-b border-slate-200 bg-white px-4 py-4 shadow-sm lg:hidden dark:border-slate-800 dark:bg-slate-900"><nav aria-label="Mobile administration" className="space-y-5">{groups.map((group) => <div key={group.title}><p className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{group.title}</p><ul className="mt-2 space-y-1">{group.links.map((item) => <li key={item.href}><Link href={item.href} onClick={() => setMobileOpen(false)} aria-current={isActive(item.href) ? "page" : undefined} className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium ${isActive(item.href) ? "bg-blue-50 text-blue-800" : "text-slate-700 hover:bg-slate-50"}`}><NavIcon name={item.icon} />{item.label}</Link></li>)}</ul></div>)}<div><p className="px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Account</p><Link href="/profile" onClick={() => setMobileOpen(false)} className="mt-2 flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium text-slate-700"><NavIcon name="users" />My account</Link><Link href="/" onClick={() => setMobileOpen(false)} className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium text-slate-700"><NavIcon name="pin" />Public website</Link></div></nav></div>}
        <main className="w-full flex-1 px-4 py-5 sm:px-6 lg:min-h-0 lg:overflow-hidden lg:px-8 lg:py-6">{children}</main>
      </div>
    </div>
  );
}
