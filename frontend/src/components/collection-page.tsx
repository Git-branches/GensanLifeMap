import type { ReactNode } from "react";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { Container, PageBand, PageHeader } from "./ui/layout";
import { EmptyState, ErrorState } from "./ui/states";

/**
 * Shared chrome for simple public listing pages (locations, projects,
 * facilities, announcements, data sources): header, title hero with live
 * total, and data | empty | error states. Individual pages supply cards.
 */
export default function CollectionPage({
  title,
  description,
  total,
  totalLabel,
  error,
  isEmpty,
  emptyMessage,
  children,
}: {
  title: string;
  description: string;
  total: number | null;
  totalLabel: string;
  error: string | null;
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
}) {
  const fullDescription =
    total !== null
      ? `${description} Currently showing ${total} ${total === 1 ? "record" : "records"}.`
      : description;

  return (
    <div className="flex min-h-full flex-col bg-sky-50 font-sans">
      <SiteHeader />
      <main className="flex-1">
        <PageBand>
          <PageHeader
            onDark
            eyebrow={totalLabel}
            title={title}
            description={fullDescription}
          />
        </PageBand>
        <Container className="py-10">
          {error && (
            <ErrorState message={error} />
          )}

          {!error && isEmpty && <EmptyState title={emptyMessage} />}

          {!error && !isEmpty && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {children}
            </div>
          )}
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
