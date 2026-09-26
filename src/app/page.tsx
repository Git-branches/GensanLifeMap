/**
 * GenSan LifeMap — public landing page.
 * Design reference: ui-mockup.png in design-workflow folder
 */

import Image from "next/image";
import Link from "next/link";
import HomepageMap from "@/components/lifemap/homepage-map";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import {
  getAnnouncements,
  getFacilities,
  getLocations,
  getProjects,
} from "@/lib/api";
import { buttonClasses } from "@/components/ui/button";
import { Badge, categoryTone } from "@/components/ui/card";
import {
  AnnounceIcon,
  ArrowRightIcon,
  DocIcon,
  FacilityIcon,
  MapIcon,
  PinIcon,
} from "@/components/ui/icons";
import { Container } from "@/components/ui/layout";
import { buildMapItems } from "@/lib/map-items";

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

export default async function Home() {
  const [loc, proj, fac, ann] = await Promise.allSettled([
    getLocations({ per_page: 50 }, FETCH_OPTS),
    getProjects({ per_page: 50 }, FETCH_OPTS),
    getFacilities({ per_page: 50 }, FETCH_OPTS),
    getAnnouncements({ per_page: 3 }, FETCH_OPTS),
  ]);

  const announcements = ann.status === "fulfilled" ? ann.value.data : null;
  const mapItems = buildMapItems(
    loc.status === "fulfilled" ? loc.value.data : [],
    proj.status === "fulfilled" ? proj.value.data : [],
    fac.status === "fulfilled" ? fac.value.data : [],
  ).items;

  return (
    <div className="flex min-h-full flex-col bg-[#e8f1f5] font-sans">
      <SiteHeader />

      <main className="flex-1">
        {/* ============ HERO ============ */}
        <section className="relative overflow-hidden bg-blue-700">
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
            className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent"
          />
          <Container>
            <div className="relative py-24 sm:py-32 lg:py-40">
              <div className="max-w-3xl">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-200">
                  <span aria-hidden="true" className="inline-block h-px w-10 bg-blue-300" />
                  GENERAL SANTOS CITY
                </p>
                <h1 className="mt-6 text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
                  Explore General Santos through one connected city map.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-blue-50 sm:text-xl">
                  Discover places, public projects, facilities, announcements,
                  and community information through one accessible platform.
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <Link href="/map" className={buttonClasses("primary", "md")}>
                    <MapIcon />
                    Explore LifeMap
                    <ArrowRightIcon />
                  </Link>
                  <Link
                    href="/about"
                    className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-white bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
                  >
                    Discover the City <ArrowRightIcon />
                  </Link>
                </div>

                <div className="mt-12 flex flex-wrap gap-8 text-sm text-blue-100">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Public information</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PinIcon />
                    <span>City map</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Community resources</span>
                  </div>
                </div>
              </div>

              {/* Scroll indicator */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
                <p className="mb-2 text-xs text-blue-200">Explore the city</p>
                <svg className="mx-auto h-6 w-6 animate-bounce text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </Container>
        </section>

        {/* ============ AT A GLANCE ============ */}
        <section aria-labelledby="glance-heading" className="bg-white py-20 lg:py-28">
          <Container>
            <div className="grid gap-16 lg:grid-cols-[400px_1fr] lg:gap-20">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                  <span aria-hidden="true" className="inline-block h-px w-10 bg-blue-600 align-middle mr-2" />
                  GENERAL SANTOS
                </p>
                <h2 id="glance-heading" className="mt-4 text-4xl font-bold leading-tight text-gray-900 lg:text-5xl">
                  At a Glance
                </h2>
                <p className="mt-6 text-base leading-relaxed text-gray-600 lg:text-lg">
                  A connected public information platform designed to help
                  residents and visitors discover places, projects, facilities,
                  and important city information.
                </p>
              </div>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <PinIcon />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-gray-900">Locations</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Parks, landmarks, and public spaces
                  </p>
                  <div className="mt-3 h-1 w-12 mx-auto rounded-full bg-blue-600" />
                </div>

                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <DocIcon />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-gray-900">Projects</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Ongoing and completed city projects
                  </p>
                  <div className="mt-3 h-1 w-12 mx-auto rounded-full bg-green-600" />
                </div>

                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                    <FacilityIcon />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-gray-900">Facilities</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Government and public facilities
                  </p>
                  <div className="mt-3 h-1 w-12 mx-auto rounded-full bg-orange-600" />
                </div>

                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                    <AnnounceIcon />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-gray-900">Announcements</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Latest updates and public notices
                  </p>
                  <div className="mt-3 h-1 w-12 mx-auto rounded-full bg-purple-600" />
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* ============ EXPLORE ============ */}
        <section aria-labelledby="explore-heading" className="bg-[#e8f1f5] py-20 lg:py-28">
          <Container>
            <div className="mb-16 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                <span aria-hidden="true" className="inline-block h-px w-10 bg-blue-600 align-middle mr-2" />
                EXPLORE GENERAL SANTOS
              </p>
              <h2 id="explore-heading" className="mt-4 text-4xl font-bold text-gray-900 lg:text-5xl">
                Discover the City
              </h2>
            </div>

            <div className="relative overflow-hidden rounded-3xl">
              <Image
                src="/images/landing/gensan.jpg"
                alt="General Santos City"
                width={1920}
                height={800}
                className="h-[500px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white lg:p-12">
                <h3 className="text-3xl font-bold lg:text-4xl">
                  Explore locations, projects, and facilities
                </h3>
                <p className="mt-4 max-w-2xl text-lg text-white/90">
                  Browse through our comprehensive database of city information
                </p>
                <Link
                  href="/locations"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors hover:text-blue-200"
                >
                  View all locations <ArrowRightIcon />
                </Link>
              </div>
            </div>
          </Container>
        </section>

        {/* ============ MAP ============ */}
        <section aria-labelledby="map-heading" className="bg-white py-20 lg:py-28">
          <Container>
            <div className="mb-12 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                <span aria-hidden="true" className="inline-block h-px w-10 bg-blue-600 align-middle mr-2" />
                INTERACTIVE MAP
              </p>
              <h2 id="map-heading" className="mt-4 text-4xl font-bold text-gray-900 lg:text-5xl">
                Your City, On One Map
              </h2>
              <p className="mt-6 text-lg text-gray-600">
                Explore General Santos through one connected geographic platform
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl shadow-2xl">
              <HomepageMap items={mapItems} />
            </div>

            <div className="mt-8 text-center">
              <Link href="/map" className={buttonClasses("primary", "md")}>
                Open LifeMap <ArrowRightIcon />
              </Link>
            </div>
          </Container>
        </section>

        {/* ============ ANNOUNCEMENTS ============ */}
        {announcements && announcements.length > 0 && (
          <section aria-labelledby="ann-heading" className="bg-[#e8f1f5] py-20 lg:py-28">
            <Container>
              <div className="mb-12 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                  <span aria-hidden="true" className="inline-block h-px w-10 bg-blue-600 align-middle mr-2" />
                  LATEST UPDATES
                </p>
                <h2 id="ann-heading" className="mt-4 text-4xl font-bold text-gray-900 lg:text-5xl">
                  Announcements
                </h2>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {announcements.map((a) => {
                  const date = formatDate(a.published_at ?? a.created_at);
                  return (
                    <article key={a.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                      <Badge tone={categoryTone(a.category)}>
                        {a.category.replace(/_/g, " ").toUpperCase()}
                      </Badge>
                      <h3 className="mt-4 text-xl font-bold text-gray-900">{a.title}</h3>
                      {date && <p className="mt-2 text-sm text-gray-500">{date}</p>}
                      {a.content && (
                        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-600">
                          {a.content}
                        </p>
                      )}
                      <Link
                        href="/announcements"
                        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Read more <ArrowRightIcon />
                      </Link>
                    </article>
                  );
                })}
              </div>

              <div className="mt-10 text-center">
                <Link
                  href="/announcements"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  View all announcements <ArrowRightIcon />
                </Link>
              </div>
            </Container>
          </section>
        )}

        {/* ============ CTA ============ */}
        <section className="bg-blue-600 py-16 text-white lg:py-20">
          <Container>
            <div className="text-center">
              <h2 className="text-3xl font-bold lg:text-4xl">
                Explore General Santos
              </h2>
              <p className="mt-4 text-lg text-blue-100">
                Discover the city through one connected map
              </p>
              <Link href="/map" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-base font-semibold text-blue-600 transition-all hover:bg-blue-50">
                <MapIcon />
                Explore LifeMap
                <ArrowRightIcon />
              </Link>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
