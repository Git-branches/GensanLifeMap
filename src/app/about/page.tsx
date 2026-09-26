import Link from "next/link";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import { AnnounceIcon, DatabaseIcon, FacilityIcon, MapIcon, PinIcon, ProjectIcon } from "@/components/ui/icons";
import { Container, PageHeader, Section } from "@/components/ui/layout";

/**
 * About GenSan LifeMap: what the platform is, what it covers, and
 * where its information comes from. Factual scope only — no claims
 * beyond the records currently in the database.
 */
export const metadata = {
  title: "About | GenSan LifeMap",
  description: "What GenSan LifeMap is and where its public information comes from.",
};

const COVERAGE = [
  {
    title: "Locations",
    text: "Places and locations across General Santos City, each with its recorded type, barangay, and coordinates.",
    href: "/locations",
    icon: <PinIcon />,
  },
  {
    title: "Projects",
    text: "Publicly listed projects with their category, status, and completion information as recorded.",
    href: "/projects",
    icon: <ProjectIcon />,
  },
  {
    title: "Facilities",
    text: "Public and community facilities, including contact details and operating hours where listed.",
    href: "/facilities",
    icon: <FacilityIcon />,
  },
  {
    title: "Announcements",
    text: "Community announcements and public information, each linked to its information source.",
    href: "/announcements",
    icon: <AnnounceIcon />,
  },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 font-sans dark:bg-black">
      <SiteHeader />
      <main className="flex-1">
        <Container>
          <div className="py-10">
            <PageHeader
              eyebrow="About"
              title="A public window into General Santos City"
              description="GenSan LifeMap is a public information platform that brings together listed records about places, public projects, community facilities, and announcements — browsable as lists and explorable on one interactive city map."
            />
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/map" className={buttonClasses("primary")}>
                Explore LifeMap
              </Link>
              <Link href="/data-sources" className={buttonClasses("secondary")}>
                View Data Sources
              </Link>
            </div>
          </div>

          <Section
            id="coverage-heading"
            title="What the platform covers"
            description="Everything shown here reflects records currently in the database."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {COVERAGE.map((c) => (
                <Card key={c.title} className="flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 transition-colors duration-200 group-hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:group-hover:bg-blue-900"
                  >
                    {c.icon}
                  </span>
                  <CardTitle className="mt-3">{c.title}</CardTitle>
                  <CardText className="flex-1">{c.text}</CardText>
                  <Link
                    href={c.href}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Browse {c.title.toLowerCase()} →
                  </Link>
                </Card>
              ))}
            </div>
          </Section>

          <Section
            id="sources-heading"
            title="Where information comes from"
            description="Announcements and records are linked to tracked information sources, so you can see the origin of what you read. Listings show what is currently tracked — not a claim of complete government records."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="flex items-start gap-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                >
                  <DatabaseIcon />
                </span>
                <div>
                  <CardTitle>Tracked sources</CardTitle>
                  <CardText>
                    See every information source currently tracked, with
                    verification dates where listed.
                  </CardText>
                  <Link
                    href="/data-sources"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View Data Sources →
                  </Link>
                </div>
              </Card>
              <Card className="flex items-start gap-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                >
                  <MapIcon />
                </span>
                <div>
                  <CardTitle>One city map</CardTitle>
                  <CardText>
                    Search places, filter by category, and open any marker for
                    its public details.
                  </CardText>
                  <Link
                    href="/map"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Open LifeMap →
                  </Link>
                </div>
              </Card>
            </div>
          </Section>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
