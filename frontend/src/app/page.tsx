import Image from "next/image";
import Link from "next/link";
import HomepageMap from "@/components/lifemap/homepage-map";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { getAnnouncements, getFacilities, getLocations, getProjects } from "@/lib/api";
import { buildMapItems } from "@/lib/map-items";
import type { Announcement } from "@/types";

export const metadata = {
  title: "GenSan LifeMap — Explore General Santos",
  description: "Discover places, public projects, facilities, announcements, and community information through one accessible platform.",
};

const FETCH_OPTS = { revalidate: 60 };
const FEATURE_AREAS = [
  { title: "Locations", text: "Find public places, landmarks, and locations around the city.", href: "/locations", image: "/images/landing/location.jpg", alt: "Aerial view of General Santos City" },
  { title: "Projects", text: "Explore public projects and their latest recorded progress.", href: "/projects", image: "/images/landing/project.jpg", alt: "Urban development and public infrastructure" },
  { title: "Facilities", text: "Locate community services and public facilities.", href: "/facilities", image: "/images/landing/facility.jpg", alt: "Public community facility" },
];
const PRINCIPLES = [
  { title: "Accessible Information", text: "Browse public information through clear listings and a searchable map." },
  { title: "Connected Places", text: "See how locations, projects, and facilities relate across the city." },
  { title: "Public Transparency", text: "Explore recorded details and their tracked information sources." },
  { title: "Community Participation", text: "Residents can submit and follow community reports with an account." },
];

function dateLabel(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

export default async function Home() {
  const [loc, proj, fac, ann] = await Promise.allSettled([
    getLocations({ per_page: 50 }, FETCH_OPTS),
    getProjects({ per_page: 50 }, FETCH_OPTS),
    getFacilities({ per_page: 50 }, FETCH_OPTS),
    getAnnouncements({ per_page: 3 }, FETCH_OPTS),
  ]);
  const locations = loc.status === "fulfilled" ? loc.value : null;
  const projects = proj.status === "fulfilled" ? proj.value : null;
  const facilities = fac.status === "fulfilled" ? fac.value : null;
  const announcements: Announcement[] = ann.status === "fulfilled" ? ann.value.data : [];
  const mapItems = buildMapItems(locations?.data ?? [], projects?.data ?? [], facilities?.data ?? []).items;
  const categories = [
    { label: "Locations", href: "/locations", count: locations?.meta.total },
    { label: "Projects", href: "/projects", count: projects?.meta.total },
    { label: "Facilities", href: "/facilities", count: facilities?.meta.total },
    { label: "Announcements", href: "/announcements", count: ann.status === "fulfilled" ? ann.value.meta.total : undefined },
  ];

  return (
    <div className="flex min-h-full flex-col bg-white font-sans">
      <SiteHeader />
      <main className="flex-1">
        <section className="overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-24">
            <div className="relative z-10">
              <p className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-blue-800"><span className="h-2 w-2 rounded-full bg-teal-500" />General Santos City</p>
              <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-[1.12] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">Explore General Santos through one connected city map.</h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">Discover places, public projects, facilities, announcements, and community information through one accessible platform.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/lifemap" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-blue-700 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Explore LifeMap <span aria-hidden="true">→</span></Link>
                <Link href="/about" className="inline-flex min-h-12 items-center rounded-full border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50">Discover the City</Link>
              </div>
              <p className="mt-7 text-sm text-slate-500">Open to everyone · No account needed to explore</p>
            </div>
            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-4 rounded-[2rem] bg-sky-100/70 blur-2xl" aria-hidden="true" />
              <div className="relative overflow-hidden rounded-[1.75rem] border border-white bg-white p-2 shadow-xl shadow-blue-900/10">
                <div className="relative h-72 overflow-hidden rounded-[1.35rem] sm:h-[24rem]">
                  <Image src="/images/landing/hero.jpg" alt="View of General Santos City" fill priority sizes="(max-width: 1024px) 100vw, 48vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/50 via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-5 rounded-2xl border border-white/70 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">One connected city</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">Places · Projects · Facilities</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="glance-title" className="border-y border-slate-100 bg-white py-9 sm:py-11">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">A public city guide</p><h2 id="glance-title" className="mt-2 text-2xl font-bold text-slate-900">GenSan LifeMap at a glance</h2><p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">A public information platform for residents and visitors to understand what is around them and what is happening in the city.</p></div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
              {categories.map((item) => <Link key={item.label} href={item.href} className="group rounded-xl px-2 py-2 transition hover:bg-sky-50"><span className="block text-2xl font-bold text-blue-800">{item.count ?? "—"}</span><span className="mt-1 block text-sm font-medium text-slate-700 group-hover:text-blue-800">{item.label}</span></Link>)}
            </div>
          </div>
        </section>

        <section aria-labelledby="explore-title" className="bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Explore General Santos</p><h2 id="explore-title" className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Discover the city</h2></div><Link href="/lifemap" className="text-sm font-semibold text-blue-800 hover:underline">Explore everything on the map →</Link></div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {FEATURE_AREAS.map((area) => <Link key={area.title} href={area.href} className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"><div className="relative h-48 overflow-hidden bg-sky-100"><Image src={area.image} alt={area.alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" /></div><div className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{area.title}</p><h3 className="mt-2 text-xl font-bold text-slate-900">Explore {area.title.toLowerCase()}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{area.text}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-800">View {area.title.toLowerCase()} <span aria-hidden="true">→</span></span></div></Link>)}
            </div>
          </div>
        </section>

        <section aria-labelledby="map-title" className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Your City, On One Map</p><h2 id="map-title" className="mt-2 text-3xl font-bold tracking-tight text-slate-900">See how the city connects</h2><p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">A small preview of the places, projects, and facilities available to explore. Open the full LifeMap to search and filter the live map.</p></div>
            <div className="mt-8 h-[22rem] overflow-hidden rounded-2xl border border-slate-200 bg-sky-50 shadow-sm sm:h-[26rem]"><HomepageMap items={mapItems} /></div>
            <div className="mt-6 text-center"><Link href="/lifemap" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-blue-700 px-6 text-sm font-semibold text-white hover:bg-blue-800">Open LifeMap <span aria-hidden="true">→</span></Link></div>
          </div>
        </section>

        <section aria-labelledby="why-title" className="bg-sky-50 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Why GenSan LifeMap</p><h2 id="why-title" className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Useful city information, made easier to navigate.</h2></div><div className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">{PRINCIPLES.map((item, index) => <article key={item.title} className="border-t-2 border-blue-200 pt-4"><span className="text-xs font-bold text-teal-700">0{index + 1}</span><h3 className="mt-2 font-semibold text-slate-900">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p></article>)}</div></div>
        </section>

        <section aria-labelledby="announcements-title" className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Latest updates</p><h2 id="announcements-title" className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Announcements</h2></div><Link href="/announcements" className="shrink-0 text-sm font-semibold text-blue-800 hover:underline">All announcements →</Link></div>
            {announcements.length ? <div className="mt-7 divide-y divide-slate-200 border-y border-slate-200">{announcements.map((item) => <article key={item.id} className="grid gap-2 py-5 sm:grid-cols-[10rem_1fr_auto] sm:items-start"><p className="text-sm text-slate-500">{dateLabel(item.published_at ?? item.created_at) ?? ""}</p><div><h3 className="font-semibold text-slate-900">{item.title}</h3>{item.content && <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{item.content}</p>}</div><span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-800">{item.category.replaceAll("_", " ")}</span></article>)}</div> : <p className="mt-6 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">No published announcements are currently available.</p>}
          </div>
        </section>

        <section className="bg-blue-800 py-14 text-white sm:py-16"><div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 sm:flex-row sm:items-center"><div><h2 className="text-2xl font-bold sm:text-3xl">Explore General Santos</h2><p className="mt-2 text-sm text-blue-100 sm:text-base">Discover the city through one connected map.</p></div><Link href="/lifemap" className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-blue-800 transition hover:bg-blue-50">Explore LifeMap <span aria-hidden="true">→</span></Link></div></section>
      </main>
      <SiteFooter />
    </div>
  );
}
