import Link from "next/link";
import type { ReactNode } from "react";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { ArrowRightIcon } from "./ui/icons";
import { Card } from "./ui/card";
import { Container, PageBand, PageHeader } from "./ui/layout";

/**
 * Shared chrome for public record detail pages (/locations/[id] etc.).
 * Same container, header pattern, and card language as every other
 * public page.
 */
export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-right font-medium text-zinc-800 dark:text-zinc-100">
        {value}
      </dd>
    </div>
  );
}

export default function DetailShell({
  eyebrow,
  title,
  subtitle,
  backHref,
  backLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string | null;
  backHref: string;
  backLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-sky-50 font-sans">
      <SiteHeader />
      <main className="flex-1">
        <PageBand>
          <Link
            href={backHref}
            className="mb-4 inline-flex flex-row-reverse items-center gap-1.5 rounded-full text-sm font-semibold text-sky-300 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span className="inline-block rotate-180">
              <ArrowRightIcon />
            </span>
            {backLabel}
          </Link>
          <PageHeader
            onDark
            eyebrow={eyebrow}
            title={title}
            {...(subtitle ? { description: subtitle } : {})}
          />
        </PageBand>
        <Container className="py-10">
          <Card className="sm:p-6">
            {children}
          </Card>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
