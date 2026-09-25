/**
 * GenSan LifeMap — public landing page.
 *
 * Visual master: the landing-page mockup (design-workflow reference,
 * image.png at the repo root). Navy hero, at-a-glance stats, photo
 * explore cards, map split band, announcements, navy transparency
 * band, navy footer.
 *
 * Functional source of truth: the Laravel REST API via the shared
 * service layer (src/lib/api). Counts use paginator `meta.total`
 * (per_page: 1). No numbers, records, or announcements are hard-coded.
 */

import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import {
  getAnnouncements,
  getDataSources,
  getFacilities,
  getLocations,
  getProjects,
} from "@/lib/api";
import { buttonClasses } from "@/components/ui/button";
import { Badge, Card, CardText, CardTitle, categoryTone } from "@/components/ui/card";
import {
  AnnounceIcon,
  ArrowRightIcon,
  DatabaseIcon,
  DocIcon,
  FacilityIcon,
  MapIcon,
  PinIcon,
  SearchIcon,
} from "@/components/ui/icons";
import { Container } from "@/components/ui/layout";
import { EmptyState, ErrorState } from "@/components/ui/states";

export const metadata = {
  title: "GenSan LifeMap — Explore General Santos",
  description:
    "Discover places, public projects, facilities, announcements, and community information through one accessible city map.",
};

const FETCH_OPTS = { revalidate: 60 };

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* Category accent system shared by stats, cards, and map pins. */
const CATEGORY = {
  locations: {
    dot: "bg-blue-600",
    chip: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    badge: "bg-blue-600",
    photo: "glm-photo-location",
  },
  projects: {
    dot: "bg-green-600",
    chip: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
    badge: "bg-green-600",
    photo: "glm-photo-project",
  },
  facilities: {
    dot: "bg-orange-500",
    chip: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    badge: "bg-orange-500",
    photo: "glm-photo-facility",
  },
} as const;

export default async function Home() {
  const [loc, proj, fac, ann, src] = await Promise.allSettled([
    getLocations({ per_page: 1 }, FETCH_OPTS),
    getProjects({ per_page: 1 }, FETCH_OPTS),
    getFacilities({ per_page: 1 }, FETCH_OPTS),
    getAnnouncements({ per_page: 3 }, FETCH_OPTS),
    getDataSources({ per_page: 1 }, FETCH_OPTS),
  ]);

  const total = (r: PromiseSettledResult<{ meta: { total: number } }>): string =>
    r.status === "fulfilled" ? String(r.value.meta.total) : "—";

  const announcements = ann.status === "fulfilled" ? ann.value.data : null;
  const announcementsError = ann.status === "rejected";
  const dataSourceTotal = total(src);

  const stats = [
    {
      key: "locations" as const,
      label: "Locations",
      value: total(loc),
      caption: "Total locations in the city",
      href: "/locations",
      icon: <PinIcon />,
    },
    {
      key: "projects" as const,
      label: "Projects",
      value: total(proj),
      caption: "Total public projects",
      href: "/projects",
      icon: <DocIcon />,
    },
    {
      key: "facilities" as const,
      label: "Facilities",
      value: total(fac),
      caption: "Total facilities",
      href: "/facilities",
      icon: <FacilityIcon />,
    },
  ];

  return (
    <div className="flex min-h-full flex-col bg-[#f4f7fb] font-sans dark:bg-black">
      <SiteHeader />

      <main className="flex-1">
        {/* ============ HERO ============ */}
        <section className="relative overflow-hidden bg-[#071425] text-white">
          <Image
            src="/images/landing/gensan.jpg"
            alt=""
            aria-hidden="true"
            fill
            priority
            className="object-cover object-center"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-[#071425] via-[#071425]/78 to-[#071425]/10"
          />
          <Container>
            <div className="relative py-14 sm:py-20">
              <div className="max-w-2xl">
                <p className="glm-fade-up flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-sky-300">
                  <span aria-hidden="true" className="inline-block h-0.5 w-8 bg-blue-500" />
                  GENERAL SANTOS CITY
                </p>
                <h1 className="glm-fade-up glm-fade-up-1 mt-4 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
                  Explore General Santos through one connected city map.
                </h1>
                <p className="glm-fade-up glm-fade-up-2 mt-4 max-w-xl text-base leading-relaxed text-slate-300">
                  Discover places, public projects, facilities,
                  announcements, and community information through one
                  accessible platform.
                </p>
                <div className="glm-fade-up glm-fade-up-3 mt-7 flex flex-wrap gap-3">
                  <Link href="/map" className={buttonClasses("primary")}>
                    <MapIcon />
                    Explore LifeMap
                    <ArrowRightIcon />
                  </Link>
                  <Link
                    href="/projects"
                    className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/40 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  >
                    Discover Projects
                  </Link>
                </div>
              </div>

              <div className="glm-fade-up glm-fade-up-2 mt-10 flex sm:justify-end">
                <p className="inline-flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur">
                  <span aria-hidden="true" className="text-sky-300">
                    <PinIcon />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">
                      General Santos City
                    </span>
                    <span className="block text-xs text-slate-300">
                      A progressive city in Southern Mindanao
                    </span>
                  </span>
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* ============ AT A GLANCE ============ */}
        <section aria-labelledby="glance-heading" className="glm-dot-grid bg-white dark:bg-zinc-950">
          <Container>
            <div className="grid gap-8 py-12 lg:grid-cols-[240px_1fr] lg:py-14">
              <div>
                <h2 id="glance-heading" className="text-2xl font-bold tracking-tight text-[#0a1c30] dark:text-zinc-50">
                  General Santos
                  <br />
                  at a Glance
                </h2>
                <span aria-hidden="true" className="mt-3 block h-0.5 w-10 bg-blue-600" />
                <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Real-time public information for a more informed community.
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-y-8 lg:grid-cols-4">
                {stats.map((s, i) => (
                  <div
                    key={s.key}
                    className={i > 0 ? "lg:border-l lg:border-zinc-200 lg:pl-8 lg:dark:border-zinc-800" : ""}
                  >
                    <Link href={s.href} className="group block" aria-label={`${s.label}: ${s.value}`}>
                      <span
                        aria-hidden="true"
                        className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${CATEGORY[s.key].chip}`}
                      >
                        {s.icon}
                      </span>
                      <dt className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                        {s.label}
                      </dt>
                      <dd className="text-4xl font-bold tracking-tight text-[#0a1c30] group-hover:text-blue-700 dark:text-zinc-50 dark:group-hover:text-blue-400">
                        {s.value}
                      </dd>
                      <dd className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {s.caption}
                      </dd>
                    </Link>
                  </div>
                ))}
                <div className="lg:border-l lg:border-zinc-200 lg:pl-8 lg:dark:border-zinc-800">
                  <Link href="/announcements" className="group block" aria-label={`Announcements: ${total(ann)}`}>
                    <span
                      aria-hidden="true"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                    >
                      <AnnounceIcon />
                    </span>
                    <dt className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                      Announcements
                    </dt>
                    <dd className="text-4xl font-bold tracking-tight text-[#0a1c30] group-hover:text-blue-700 dark:text-zinc-50 dark:group-hover:text-blue-400">
                      {total(ann)}
                    </dd>
                    <dd className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Latest announcements
                    </dd>
                  </Link>
                </div>
              </dl>
            </div>
          </Container>
        </section>

        {/* ============ EXPLORE ============ */}
        <section aria-labelledby="explore-heading" className="bg-[#f4f7fb] dark:bg-black">
          <Container>
            <div className="py-12 lg:py-14">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-blue-700 dark:text-blue-400">
                    EXPLORE
                  </p>
                  <h2 id="explore-heading" className="mt-1 text-2xl font-bold tracking-tight text-[#0a1c30] dark:text-zinc-50 sm:text-3xl">
                    General Santos
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    Find what you need, from places and projects to public
                    facilities across the city.
                  </p>
                </div>
                <Link
                  href="/map"
                  className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
                >
                  View All <ArrowRightIcon />
                </Link>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {(
                  [
                    {
                      key: "locations" as const,
                      title: "Locations",
                      text: "Discover places and locations across General Santos City.",
                      href: "/locations",
                      count: `${total(loc)} locations`,
                      icon: <PinIcon />,
                      photo: "/images/landing/location.jpg",
                      photoAlt: "",
                    },
                    {
                      key: "projects" as const,
                      title: "Projects",
                      text: "Explore publicly listed projects and their current information.",
                      href: "/projects",
                      count: `${total(proj)} projects`,
                      icon: <DocIcon />,
                      photo: "/images/landing/project.jpg",
                      photoAlt: "",
                    },
                    {
                      key: "facilities" as const,
                      title: "Facilities",
                      text: "Find important public and community facilities.",
                      href: "/facilities",
                      count: `${total(fac)} facilities`,
                      icon: <FacilityIcon />,
                      photo: "/images/landing/facility.jpg",
                      photoAlt: "",
                    },
                  ]
                ).map((c, i) => (
                  <article
                    key={c.key}
                    className={`glm-fade-up rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 ${
                      i === 1 ? "glm-fade-up-1" : i === 2 ? "glm-fade-up-2" : ""
                    }`}
                  >
                    <div aria-hidden="true" className="relative z-10 h-36 rounded-t-xl">
                      <div className="absolute inset-0 overflow-hidden rounded-t-xl">
                        <Image
                          src={c.photo}
                          alt={c.photoAlt}
                          fill
                          sizes="(min-width: 768px) 33vw, 100vw"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                      </div>
                      <span
                        className={`absolute bottom-0 left-5 z-20 flex h-11 w-11 translate-y-1/2 items-center justify-center rounded-full text-white shadow-lg ring-4 ring-white dark:ring-zinc-950 ${CATEGORY[c.key].badge}`}
                      >
                        {c.icon}
                      </span>
                    </div>
                    <div className="p-5 pt-7">
                      <h3 className="text-base font-bold text-[#0a1c30] dark:text-zinc-50">
                        {c.title}
                      </h3>
                      <p className="mt-1 min-h-10 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {c.text}
                      </p>
                      <p className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-sm dark:border-zinc-800">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          <strong className="font-semibold text-zinc-700 dark:text-zinc-200">
                            {c.count.split(" ")[0]}
                          </strong>{" "}
                          {c.count.split(" ").slice(1).join(" ")}
                        </span>
                        <Link
                          href={c.href}
                          className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline dark:text-blue-400"
                        >
                          Explore <ArrowRightIcon />
                        </Link>
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* ============ MAP SPLIT BAND ============ */}
        <section aria-labelledby="mapband-heading" className="bg-white dark:bg-zinc-950">
          <div className="mx-auto grid max-w-6xl gap-0 px-4 py-12 lg:grid-cols-2 lg:py-14">
            <Link
              href="/map"
              aria-label="Open the interactive LifeMap"
              className="group relative block min-h-64 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 lg:min-h-80 lg:rounded-r-none"
            >
              <Image
                src="/images/landing/map.jpg"
                alt=""
                aria-hidden="true"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <span className="absolute inset-0 ring-1 ring-inset ring-black/10" aria-hidden="true" />
            </Link>

            <div className="flex flex-col justify-center rounded-xl border border-zinc-200 bg-[#f4f7fb] p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:p-8 lg:rounded-l-none lg:border-l-0">
              <h2 id="mapband-heading" className="text-2xl font-bold tracking-tight text-[#0a1c30] dark:text-zinc-50">
                Your City, On One Map
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Explore General Santos City through an interactive map.
                Search, filter, and discover locations, public projects,
                facilities and more.
              </p>
              <p className="mt-5">
                <Link href="/map" className={buttonClasses("primary")}>
                  Open LifeMap <ArrowRightIcon />
                </Link>
              </p>
              <ul className="mt-6 grid grid-cols-3 gap-2">
                {[
                  { icon: <SearchIcon />, label: "Search & Filter" },
                  { icon: <DocIcon />, label: "View Details" },
                  { icon: <MapIcon />, label: "Explore the City" },
                ].map((f) => (
                  <li key={f.label} className="text-center">
                    <span
                      aria-hidden="true"
                      className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    >
                      {f.icon}
                    </span>
                    <span className="mt-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ============ ANNOUNCEMENTS ============ */}
        <section aria-labelledby="ann-heading" className="bg-[#f4f7fb] dark:bg-black">
          <Container>
            <div className="grid gap-6 py-12 lg:grid-cols-[260px_1fr] lg:py-14">
              <div>
                <h2 id="ann-heading" className="text-2xl font-bold leading-tight tracking-tight text-[#0a1c30] dark:text-zinc-50">
                  Latest
                  <br />
                  Announcements
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Stay informed with the latest updates and public notices
                  from General Santos City.
                </p>
                <Link
                  href="/announcements"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-blue-600 px-4 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950"
                >
                  View All Announcements <ArrowRightIcon />
                </Link>
              </div>

              <div>
                {announcementsError && (
                  <ErrorState message="Announcements couldn't be loaded right now. Please try again later." />
                )}
                {announcements && announcements.length === 0 && !announcementsError && (
                  <EmptyState title="No announcements have been published yet." />
                )}
                {announcements && announcements.length > 0 && (
                  <ul className="grid gap-4 md:grid-cols-3">
                    {announcements.map((a) => {
                      const date = formatDate(a.published_at ?? a.created_at);
                      return (
                        <li key={a.id} className="flex">
                          <Card className="glm-lift flex w-full flex-col">
                            <Badge tone={categoryTone(a.category)}>
                              {a.category.replace(/_/g, " ").toUpperCase()}
                            </Badge>
                            <CardTitle>{a.title}</CardTitle>
                            {date && (
                              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                {date}
                              </p>
                            )}
                            {a.content && (
                              <CardText className="line-clamp-2 flex-1">
                                {a.content}
                              </CardText>
                            )}
                            <Link
                              href="/announcements"
                              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
                            >
                              Read more <ArrowRightIcon />
                            </Link>
                          </Card>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </Container>
        </section>

        {/* ============ TRANSPARENCY ============ */}
        <section aria-labelledby="transparency-heading" className="glm-hero-bg text-white">
          <Container>
            <div className="grid items-center gap-8 py-12 lg:grid-cols-[300px_1fr] lg:py-14">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-sky-300">
                  TRANSPARENCY
                </p>
                <h2 id="transparency-heading" className="mt-2 text-2xl font-bold tracking-tight">
                  Information You Can Trace
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Discover reliable information about public projects,
                  locations, facilities, announcements and the sources
                  behind the data.
                </p>
                <Link
                  href="/data-sources"
                  className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-white/40 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  Explore Data Sources <ArrowRightIcon />
                </Link>
              </div>
              <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  { icon: <DocIcon />, bg: "bg-green-600", label: "Projects", caption: "Public projects and current information", href: "/projects" },
                  { icon: <PinIcon />, bg: "bg-blue-600", label: "Locations", caption: "Places and key city locations", href: "/locations" },
                  { icon: <FacilityIcon />, bg: "bg-purple-600", label: "Facilities", caption: "Public and community facilities", href: "/facilities" },
                  { icon: <AnnounceIcon />, bg: "bg-orange-500", label: "Announcements", caption: "Latest updates and notices", href: "/announcements" },
                  { icon: <DatabaseIcon />, bg: "bg-slate-500", label: "Data Sources", caption: `Where the information comes from (${dataSourceTotal})`, href: "/data-sources" },
                ].map((t) => (
                  <li key={t.label} className="text-center">
                    <Link href={t.href} className="group block" aria-label={`${t.label} — ${t.caption}`}>
                      <span aria-hidden="true" className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${t.bg} text-white shadow-lg transition-transform group-hover:scale-105`}>
                        {t.icon}
                      </span>
                      <span className="mt-2 block text-sm font-semibold text-white">
                        {t.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-slate-400">
                        {t.caption}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
