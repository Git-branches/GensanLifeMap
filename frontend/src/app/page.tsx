import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import AuthCta from "@/components/auth-cta";
import HomepageMap from "@/components/lifemap/homepage-map";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { Badge, categoryTone } from "@/components/ui/card";
import {
  AnnounceIcon,
  ArrowRightIcon,
  DatabaseIcon,
  FacilityIcon,
  MapIcon,
  PinIcon,
  ProjectIcon,
  SearchIcon,
  ShieldIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { getAnnouncements, getFacilities, getLocations, getProjects } from "@/lib/api";
import { buildMapItems } from "@/lib/map-items";
import type { Announcement } from "@/types";

export const metadata = {
  title: "GenSan LifeMap — Explore General Santos",
  description: "Find a barangay hall, see how far a road project has come, or read this week's city notices. Everything the city lists publicly, on one map of General Santos.",
};

const FETCH_OPTS = { revalidate: 60 };
/** Records previewed per category card in the Explore section. */
const PREVIEW_COUNT = 3;

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700";
/** Focus ring for controls sitting on the hero photo. */
const HERO_FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/** Category tints follow the design tokens in globals.css. */
const TONES = {
  location: { tile: "bg-blue-50 text-blue-700", dot: "bg-blue-600", bar: "bg-blue-600", hover: "hover:border-blue-300" },
  project: { tile: "bg-green-50 text-green-700", dot: "bg-green-600", bar: "bg-green-600", hover: "hover:border-green-300" },
  facility: { tile: "bg-orange-50 text-orange-700", dot: "bg-orange-500", bar: "bg-orange-500", hover: "hover:border-orange-300" },
  announcement: { tile: "bg-purple-50 text-purple-700", dot: "bg-purple-600", bar: "bg-purple-600", hover: "hover:border-purple-300" },
} as const;

type Tone = keyof typeof TONES;

const PRINCIPLES = [
  { title: "Accessible information", text: "Browse public information through clear listings and a searchable map.", icon: <SearchIcon /> },
  { title: "Connected places", text: "See how locations, projects, and facilities relate across the city.", icon: <MapIcon /> },
  { title: "Public transparency", text: "Explore recorded details and their tracked information sources.", icon: <DatabaseIcon /> },
  { title: "Community participation", text: "Residents can report issues and follow them with an account.", icon: <UsersIcon /> },
];

interface PreviewRow {
  id: number;
  href: string;
  title: string;
  meta: string | null;
  /** Completion percentage; only set for projects. */
  progress?: number;
}

function dateLabel(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

function joinMeta(...parts: (string | null | undefined)[]) {
  return parts.filter(Boolean).join(" · ") || null;
}

function Eyebrow({ children, onDark = false }: { children: ReactNode; onDark?: boolean }) {
  return <p className={`text-xs font-bold uppercase tracking-[0.16em] ${onDark ? "text-amber-400" : "text-blue-700"}`}>{children}</p>;
}

function IconTile({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span aria-hidden="true" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONES[tone].tile}`}>
      {children}
    </span>
  );
}

function ExploreCard({
  tone,
  icon,
  title,
  text,
  href,
  total,
  rows,
}: {
  tone: Tone;
  icon: ReactNode;
  title: string;
  text: string;
  href: string;
  total: number | undefined;
  rows: PreviewRow[];
}) {
  const noun = title.toLowerCase();
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
      <span aria-hidden="true" className={`h-1 ${TONES[tone].bar}`} />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between gap-3">
          <IconTile tone={tone}>{icon}</IconTile>
          {total !== undefined && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {total} listed
            </span>
          )}
        </div>
        <h3 className="mt-4 text-xl font-bold text-slate-900">{title}</h3>
        <p className="mt-1.5 text-sm leading-6 text-slate-600">{text}</p>

        {rows.length > 0 && (
          <ul className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
            {rows.map((row) => (
              <li key={row.id}>
                <Link href={row.href} className={`group -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-slate-50 ${FOCUS_RING}`}>
                  <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${TONES[tone].dot}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800 group-hover:text-blue-800">{row.title}</span>
                    {row.meta && <span className="block truncate text-xs capitalize text-slate-500">{row.meta}</span>}
                    {row.progress !== undefined && (
                      <span className="mt-1.5 flex items-center gap-2">
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                          <span className={`block h-full rounded-full ${TONES[tone].bar}`} style={{ width: `${row.progress}%` }} />
                        </span>
                        <span className="w-9 text-right text-xs font-semibold tabular-nums text-slate-600">{row.progress}%</span>
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Link href={href} className={`mt-auto inline-flex w-fit items-center gap-1.5 rounded-full pt-5 text-sm font-semibold text-blue-800 hover:underline ${FOCUS_RING}`}>
          View all {noun} <ArrowRightIcon />
        </Link>
      </div>
    </article>
  );
}

function AnnouncementCard({ item }: { item: Announcement }) {
  const date = dateLabel(item.published_at ?? item.created_at);
  return (
    <article className="glm-lift relative flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <span className="capitalize">
          <Badge tone={categoryTone(item.category)}>{humanize(item.category)}</Badge>
        </span>
        {date && <time className="shrink-0 text-xs font-medium text-slate-500">{date}</time>}
      </div>
      <h3 className="mt-4 text-lg font-bold leading-snug text-slate-900">
        <Link href={`/announcements/${item.id}`} className={`rounded after:absolute after:inset-0 after:rounded-2xl hover:text-blue-800 ${FOCUS_RING}`}>
          {item.title}
        </Link>
      </h3>
      {item.content && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{item.content}</p>}
      <p className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs text-slate-500">
        <span className="truncate">{item.source ? `Source: ${item.source.name}` : "GenSan LifeMap"}</span>
        <span aria-hidden="true" className="text-blue-700"><ArrowRightIcon /></span>
      </p>
    </article>
  );
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
  const dataUnavailable = [loc, proj, fac, ann].some((result) => result.status === "rejected");

  const mapItems = buildMapItems(locations?.data ?? [], projects?.data ?? [], facilities?.data ?? []).items;

  const categories = [
    { tone: "location", label: "Locations", text: "Places and landmarks", href: "/locations", icon: <PinIcon />, count: locations?.meta.total },
    { tone: "project", label: "Projects", text: "Public works and progress", href: "/projects", icon: <ProjectIcon />, count: projects?.meta.total },
    { tone: "facility", label: "Facilities", text: "Community services", href: "/facilities", icon: <FacilityIcon />, count: facilities?.meta.total },
    { tone: "announcement", label: "Announcements", text: "Updates and notices", href: "/announcements", icon: <AnnounceIcon />, count: ann.status === "fulfilled" ? ann.value.meta.total : undefined },
  ] satisfies { tone: Tone; label: string; text: string; href: string; icon: ReactNode; count: number | undefined }[];

  const explore = [
    {
      tone: "location",
      icon: <PinIcon />,
      title: "Locations",
      text: "Find public places, landmarks, and locations around the city.",
      href: "/locations",
      total: locations?.meta.total,
      rows: (locations?.data ?? []).slice(0, PREVIEW_COUNT).map((item) => ({
        id: item.id,
        href: `/locations/${item.id}`,
        title: item.name,
        meta: joinMeta(humanize(item.location_type), item.barangay && `Brgy. ${item.barangay}`),
      })),
    },
    {
      tone: "project",
      icon: <ProjectIcon />,
      title: "Projects",
      text: "Explore public projects and their latest recorded progress.",
      href: "/projects",
      total: projects?.meta.total,
      rows: (projects?.data ?? []).slice(0, PREVIEW_COUNT).map((item) => ({
        id: item.id,
        href: `/projects/${item.id}`,
        title: item.title,
        meta: joinMeta(humanize(item.status), humanize(item.category)),
        progress: Math.min(100, Math.max(0, Math.round(Number(item.completion_percentage) || 0))),
      })),
    },
    {
      tone: "facility",
      icon: <FacilityIcon />,
      title: "Facilities",
      text: "Locate community services and public facilities.",
      href: "/facilities",
      total: facilities?.meta.total,
      rows: (facilities?.data ?? []).slice(0, PREVIEW_COUNT).map((item) => ({
        id: item.id,
        href: `/facilities/${item.id}`,
        title: item.name,
        meta: joinMeta(humanize(item.category), item.location?.barangay && `Brgy. ${item.location.barangay}`),
      })),
    },
  ] satisfies { tone: Tone; icon: ReactNode; title: string; text: string; href: string; total: number | undefined; rows: PreviewRow[] }[];

  return (
    <div className="flex min-h-full flex-col bg-sky-50 font-sans">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-slate-950">
          {/* Full-bleed city photo under a neutral dim (no color tint), a
              little deeper at the top, so the white copy stays readable.
              `unoptimized` serves the original file without recompression. */}
          <Image src="/images/landing/gensan.jpg" alt="" fill priority unoptimized sizes="100vw" className="-z-20 object-cover object-[60%_center]" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-slate-950/40" />
          <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-1/2 bg-linear-to-b from-slate-950/45 to-transparent" />
          <div className="mx-auto flex max-w-6xl items-center px-4 pb-14 pt-16 sm:pt-20 lg:min-h-152 lg:pb-20 lg:pt-24">
            <div className="max-w-2xl">
              <p className="glm-fade-up inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-amber-400">
                <span aria-hidden="true" className="h-0.5 w-8 rounded-full bg-amber-400" />
                General Santos City
              </p>
              <h1 className="glm-fade-up glm-fade-up-1 mt-5 text-balance text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Explore General Santos through one connected city map.
              </h1>
              <p className="glm-fade-up glm-fade-up-2 mt-5 max-w-xl text-base leading-7 text-white sm:text-lg">
                Find a barangay hall, see how far a road project has come, or read this week&apos;s city notices. Everything the city lists publicly, on one map of General Santos.
              </p>

              <form action="/lifemap" role="search" className="glm-fade-up glm-fade-up-3 mt-8 flex max-w-xl items-center gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-slate-950/40 transition focus-within:ring-4 focus-within:ring-white/70 sm:rounded-full">
                <label htmlFor="hero-search" className="sr-only">Search places, projects, and facilities</label>
                <span aria-hidden="true" className="pl-3 text-slate-400"><SearchIcon /></span>
                <input
                  id="hero-search"
                  name="q"
                  type="search"
                  autoComplete="off"
                  placeholder="Search a place, project, or barangay"
                  className="min-h-11 min-w-0 flex-1 bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                <button type="submit" className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white transition hover:bg-blue-800 sm:rounded-full ${FOCUS_RING}`}>
                  <span className="hidden sm:inline">Search the map</span>
                  <span className="sm:hidden">Search</span>
                </button>
              </form>

              <div className="glm-fade-up glm-fade-up-3 mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                <Link href="/lifemap" className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-white/60 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/20 ${HERO_FOCUS_RING}`}>
                  <MapIcon /> Open the full LifeMap <ArrowRightIcon />
                </Link>
                <Link href="/about" className={`rounded-full text-sm font-semibold text-white underline-offset-4 hover:underline ${HERO_FOCUS_RING}`}>
                  About the platform
                </Link>
              </div>

              <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white">
                <li className="inline-flex items-center gap-2"><ShieldIcon />Public information</li>
                <li className="inline-flex items-center gap-2"><MapIcon />One city map</li>
                <li className="inline-flex items-center gap-2"><UsersIcon />No account needed to explore</li>
              </ul>
            </div>
          </div>
        </section>

        {/* At a glance */}
        <section aria-labelledby="glance-title" className="bg-sky-100 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <Eyebrow>A public city guide</Eyebrow>
                <h2 id="glance-title" className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900">GenSan LifeMap at a glance</h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600 sm:text-base">
                  A public information platform for residents and visitors to understand what is around them and what is happening in the city.
                </p>
              </div>
              {dataUnavailable && (
                <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 lg:justify-self-end">
                  Some live figures are temporarily unavailable. Please check back shortly.
                </p>
              )}
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {categories.map((item) => (
                <Link key={item.label} href={item.href} className={`glm-lift group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-lg ${TONES[item.tone].hover} ${FOCUS_RING}`}>
                  <IconTile tone={item.tone}>{item.icon}</IconTile>
                  <span className="mt-4 block text-3xl font-bold tabular-nums tracking-tight text-slate-900">{item.count ?? "—"}</span>
                  <span className="mt-1 block text-sm font-semibold text-slate-800">{item.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{item.text}</span>
                  <span aria-hidden="true" className={`absolute inset-x-5 bottom-0 h-0.5 origin-left scale-x-[0.2] rounded-full transition-transform duration-300 group-hover:scale-x-100 ${TONES[item.tone].bar}`} />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Explore */}
        <section id="explore" aria-labelledby="explore-title" className="scroll-mt-20 bg-sky-50 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <Eyebrow>Explore General Santos</Eyebrow>
                <h2 id="explore-title" className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900">Discover the city</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">Start with a category, or jump straight to a recently listed record.</p>
              </div>
              <Link href="/lifemap" className={`inline-flex shrink-0 items-center gap-1.5 rounded-full text-sm font-semibold text-blue-800 hover:underline ${FOCUS_RING}`}>
                Explore everything on the map <ArrowRightIcon />
              </Link>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {explore.map((area) => <ExploreCard key={area.title} {...area} />)}
            </div>
          </div>
        </section>

        {/* Map preview */}
        <section aria-labelledby="map-title" className="bg-sky-100 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="max-w-2xl">
                <Eyebrow>Your city, on one map</Eyebrow>
                <h2 id="map-title" className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900">See how the city connects</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                  A preview of the places, projects, and facilities available to explore. Select a marker for details, or open the full LifeMap to search and filter.
                </p>
              </div>
              <Link href="/lifemap" className={`inline-flex min-h-11 w-fit shrink-0 items-center gap-2 rounded-full bg-blue-700 px-6 text-sm font-semibold text-white transition hover:bg-blue-800 ${FOCUS_RING}`}>
                <MapIcon /> Open LifeMap
              </Link>
            </div>
            <div className="mt-8 h-96 overflow-hidden rounded-3xl border-4 border-white bg-sky-200 shadow-lg shadow-blue-900/10 sm:h-120">
              <HomepageMap items={mapItems} />
            </div>
          </div>
        </section>

        {/* Why */}
        <section aria-labelledby="why-title" className="bg-blue-950 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="max-w-2xl">
              <Eyebrow onDark>Why GenSan LifeMap</Eyebrow>
              <h2 id="why-title" className="mt-2 font-display text-3xl font-bold tracking-tight text-white">Useful city information, made easier to navigate.</h2>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PRINCIPLES.map((item, index) => (
                <article key={item.title} className="border-t border-white/25 pt-5">
                  <span className="font-display text-2xl font-bold text-amber-400">0{index + 1}</span>
                  <h3 className="mt-3 font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-blue-100">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Announcements */}
        <section aria-labelledby="announcements-title" className="bg-sky-50 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <Eyebrow>Latest updates</Eyebrow>
                <h2 id="announcements-title" className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900">Announcements</h2>
              </div>
              <Link href="/announcements" className={`inline-flex shrink-0 items-center gap-1.5 rounded-full text-sm font-semibold text-blue-800 hover:underline ${FOCUS_RING}`}>
                All announcements <ArrowRightIcon />
              </Link>
            </div>
            {announcements.length ? (
              <div className="mt-8 grid gap-5 md:grid-cols-3">
                {announcements.map((item) => <AnnouncementCard key={item.id} item={item} />)}
              </div>
            ) : (
              <div className="mt-8 flex items-center gap-4 rounded-2xl border border-dashed border-sky-300 bg-white/60 p-6">
                <IconTile tone="announcement"><AnnounceIcon /></IconTile>
                <p className="text-sm text-slate-600">No published announcements are currently available.</p>
              </div>
            )}
          </div>
        </section>

        {/* Closing call to action */}
        <section aria-labelledby="cta-title" className="bg-sky-50 pb-16 sm:pb-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="relative isolate overflow-hidden rounded-3xl bg-blue-800 px-6 py-12 text-white sm:px-12 sm:py-14">
              <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
                <div className="max-w-xl">
                  <h2 id="cta-title" className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Explore the city, and help keep it up to date.</h2>
                  <p className="mt-3 text-sm leading-6 text-blue-100 sm:text-base">
                    Anyone can browse the map. Residents with an account can report issues and follow their status.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/lifemap" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-blue-800 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                    Explore LifeMap <ArrowRightIcon />
                  </Link>
                  <AuthCta />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
