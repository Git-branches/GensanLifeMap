import Link from "next/link";

const footerLink = "text-sm text-blue-100 transition-colors hover:text-white hover:underline";
const footerHeading = "text-xs font-bold uppercase tracking-wider text-amber-400";

export default function SiteFooter() {
  return (
    <footer className="bg-blue-950 text-blue-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="GenSan LifeMap home">
            <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 17.5S4 11.8 4 7.5a6 6 0 1 1 12 0c0 4.3-6 10-6 10Z" stroke="currentColor" strokeWidth="1.6"/><circle cx="10" cy="7.5" r="2" fill="currentColor"/></svg>
            </span>
            <span><span className="block text-sm font-bold tracking-wide text-white">GenSan LifeMap</span><span className="block text-xs text-blue-200">General Santos City</span></span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-blue-100">A public information platform helping residents and visitors explore General Santos City.</p>
        </div>
        <nav aria-label="Explore"><h2 className={footerHeading}>Explore</h2><ul className="mt-3 space-y-2"><li><Link className={footerLink} href="/lifemap">LifeMap</Link></li><li><Link className={footerLink} href="/locations">Locations</Link></li><li><Link className={footerLink} href="/projects">Projects</Link></li><li><Link className={footerLink} href="/facilities">Facilities</Link></li></ul></nav>
        <nav aria-label="Discover"><h2 className={footerHeading}>Discover</h2><ul className="mt-3 space-y-2"><li><Link className={footerLink} href="/announcements">Announcements</Link></li><li><Link className={footerLink} href="/data-sources">Data Sources</Link></li><li><Link className={footerLink} href="/about">About</Link></li></ul></nav>
        <div><h2 className={footerHeading}>About this platform</h2><p className="mt-3 text-sm leading-6 text-blue-100">Content reflects publicly listed records currently tracked by the platform.</p><p className="mt-3 text-xs text-blue-200">General Santos City</p></div>
      </div>
      <div className="border-t border-white/10"><p className="mx-auto max-w-6xl px-4 py-4 text-xs text-blue-200">GenSan LifeMap · Public information prototype for General Santos City.</p></div>
    </footer>
  );
}
