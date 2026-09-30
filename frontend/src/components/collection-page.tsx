import type { ReactNode } from "react";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { Container, PageHeader } from "./ui/layout";
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
    <div className="flex min-h-full flex-col bg-zinc-50 font-sans dark:bg-black">
      <SiteHeader />
      <main className="flex-1 py-10">
        <Container>
          <PageHeader
            eyebrow={totalLabel}
            title={title}
            description={fullDescription}
          />

          {error && (
            <div className="mt-6">
              <ErrorState message={error} />
            </div>
          )}

          {!error && isEmpty && (
            <div className="mt-6">
              <EmptyState title={emptyMessage} />
            </div>
          )}

          {!error && !isEmpty && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {children}
            </div>
          )}
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
