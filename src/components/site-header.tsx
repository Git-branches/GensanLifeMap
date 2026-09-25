"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { buttonClasses } from "./ui/button";
import { ChevronDownIcon, CloseIcon, MenuIcon, SearchIcon } from "./ui/icons";

interface NavGroup {
  label: string;
  links: { href: string; label: string }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Explore",
    links: [
      { href: "/map", label: "LifeMap" },
      { href: "/locations", label: "Locations" },
      { href: "/facilities", label: "Facilities" },
    ],
  },
  {
    label: "Discover",
    links: [
      { href: "/projects", label: "Projects" },
      { href: "/announcements", label: "Announcements" },
    ],
  },
  {
    label: "About",
    links: [
      { href: "/about", label: "About" },
      { href: "/data-sources", label: "Data Sources" },
    ],
  },
];

/**
 * Public site header (mockup master): deep-navy bar with the GenSan
 * LifeMap emblem, grouped dropdown navigation, search shortcut, and
 * the blue "Explore LifeMap" CTA. Dropdowns open on hover AND on
 * keyboard focus (focus-within), so they stay keyboard-accessible.
 */
export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const groupActive = (group: NavGroup) =>
    group.links.some((l) => isActive(l.href));

  const topLink =
    "flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70";

  return (
    <header className="sticky top-0 z-40 shrink-0 bg-[#0a1c30]/95 text-white shadow-lg backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label="GenSan LifeMap home">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-700 text-white shadow"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M10 17.5S4 11.8 4 7.5a6 6 0 1 1 12 0c0 4.3-6 10-6 10Z"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <circle cx="10" cy="7.5" r="2" fill="currentColor" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block text-base font-bold tracking-wide">
              GENSAN
            </span>
            <span className="block text-[11px] font-semibold tracking-[0.18em] text-sky-300">
              LIFE MAP
            </span>
            <span className="block text-[9px] tracking-[0.14em] text-slate-400">
              GENERAL SANTOS CITY
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="group relative">
              <button
                type="button"
                aria-haspopup="true"
                className={`${topLink} ${
                  groupActive(group)
                    ? "bg-white/15 text-white"
                    : "text-slate-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                {group.label}
                <ChevronDownIcon />
              </button>
              <div className="invisible absolute left-0 top-full pt-2 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <ul className="w-48 overflow-hidden rounded-xl border border-white/10 bg-[#0e2540] p-1.5 shadow-xl">
                  {group.links.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={isActive(item.href) ? "page" : undefined}
                        className={`block rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                          isActive(item.href)
                            ? "bg-blue-600 font-medium text-white"
                            : "text-slate-200 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/map"
            aria-label="Search the LifeMap"
            className="rounded-full p-2 text-slate-200 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <SearchIcon />
          </Link>
          <Link
            href="/map"
            className={`${buttonClasses("primary", "sm")} hidden sm:inline-flex`}
          >
            Explore LifeMap
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            className="rounded-lg p-2 text-slate-200 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 lg:hidden"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-white/10 bg-[#0a1c30] px-4 py-3 lg:hidden"
        >
          <ul className="flex flex-col gap-3">
            {NAV_GROUPS.map((group) => (
              <li key={group.label}>
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {group.label}
                </p>
                <ul className="mt-1 flex flex-col gap-0.5">
                  {group.links.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={isActive(item.href) ? "page" : undefined}
                        className={`block rounded-lg px-3 py-2.5 text-base font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                          isActive(item.href)
                            ? "bg-white/15 text-white"
                            : "text-slate-200"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
            <li className="pt-1">
              <Link
                href="/map"
                onClick={() => setOpen(false)}
                className="block rounded-full bg-blue-600 px-4 py-2.5 text-center text-base font-medium text-white"
              >
                Explore LifeMap
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
