import Link from "next/link";

/**
 * Public site footer (mockup master): deep-navy band with the brand
 * block, link columns, and a factual scope note. Makes no claim of
 * official government ownership or endorsement.
 */
export default function SiteFooter() {
  const link =
    "text-slate-300 transition-colors hover:text-white hover:underline";

  return (
    <footer className="bg-[#071425] text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-700 text-white"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M10 17.5S4 11.8 4 7.5a6 6 0 1 1 12 0c0 4.3-6 10-6 10Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <circle cx="10" cy="7.5" r="2" fill="currentColor" />
              </svg>
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold tracking-wide text-white">
                GENSAN
              </span>
              <span className="block text-[10px] font-semibold tracking-[0.18em] text-sky-300">
                LIFE MAP
              </span>
            </span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            A public information platform helping residents and visitors
            explore places, projects, facilities, and announcements in
            General Santos City.
          </p>
        </div>

        <nav aria-label="Explore">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Explore
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className={link} href="/map">LifeMap</Link></li>
            <li><Link className={link} href="/locations">Locations</Link></li>
            <li><Link className={link} href="/projects">Projects</Link></li>
            <li><Link className={link} href="/facilities">Facilities</Link></li>
          </ul>
        </nav>

        <nav aria-label="Information">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Information
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className={link} href="/announcements">Announcements</Link></li>
            <li><Link className={link} href="/data-sources">Data Sources</Link></li>
            <li><Link className={link} href="/about">About</Link></li>
            <li><Link className={link} href="/api-status">API Status</Link></li>
          </ul>
        </nav>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            About this platform
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Content is drawn from publicly listed records. Availability
            reflects what is currently in the database, not a claim of
            complete government records.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            General Santos City
            <br />A more informed. A stronger community.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-500">
          GenSan LifeMap — public information prototype for General Santos City.
        </p>
      </div>
    </footer>
  );
}
