import Link from "next/link";
import type { ReactNode } from "react";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { buttonClasses } from "./ui/button";
import { ArrowRightIcon } from "./ui/icons";
import { Card } from "./ui/card";
import { Container, PageHeader } from "./ui/layout";

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
    <div className="flex min-h-full flex-col bg-zinc-50 font-sans dark:bg-black">
      <SiteHeader />
      <main className="flex-1 py-10">
        <Container>
          <Link
            href={backHref}
            className={buttonClasses("link", "md", "mb-4 inline-flex flex-row-reverse")}
          >
            <span className="inline-block rotate-180">
              <ArrowRightIcon />
            </span>
            {backLabel}
          </Link>
          <PageHeader
            eyebrow={eyebrow}
            title={title}
            {...(subtitle ? { description: subtitle } : {})}
          />
          <Card className="mt-6 sm:p-6">
            {children}
          </Card>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
