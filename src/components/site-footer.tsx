import Link from "next/link";

const footerLink = "text-sm text-slate-600 transition-colors hover:text-blue-800 hover:underline";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-700">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="GenSan LifeMap home">
            <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-white">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 17.5S4 11.8 4 7.5a6 6 0 1 1 12 0c0 4.3-6 10-6 10Z" stroke="currentColor" strokeWidth="1.6"/><circle cx="10" cy="7.5" r="2" fill="currentColor"/></svg>
            </span>
            <span><span className="block text-sm font-bold tracking-wide text-slate-900">GenSan LifeMap</span><span className="block text-xs text-slate-500">General Santos City</span></span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-600">A public information platform helping residents and visitors explore General Santos City.</p>
        </div>
        <nav aria-label="Explore"><h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Explore</h2><ul className="mt-3 space-y-2"><li><Link className={footerLink} href="/lifemap">LifeMap</Link></li><li><Link className={footerLink} href="/locations">Locations</Link></li><li><Link className={footerLink} href="/projects">Projects</Link></li><li><Link className={footerLink} href="/facilities">Facilities</Link></li></ul></nav>
        <nav aria-label="Discover"><h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Discover</h2><ul className="mt-3 space-y-2"><li><Link className={footerLink} href="/announcements">Announcements</Link></li><li><Link className={footerLink} href="/data-sources">Data Sources</Link></li><li><Link className={footerLink} href="/about">About</Link></li></ul></nav>
        <div><h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">About this platform</h2><p className="mt-3 text-sm leading-6 text-slate-600">Content reflects publicly listed records currently tracked by the platform.</p><p className="mt-3 text-xs text-slate-500">General Santos City</p></div>
      </div>
      <div className="border-t border-slate-100"><p className="mx-auto max-w-6xl px-4 py-4 text-xs text-slate-500">GenSan LifeMap · Public information prototype for General Santos City.</p></div>
    </footer>
  );
}
