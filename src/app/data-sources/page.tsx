import CollectionPage from "@/components/collection-page";
import { getDataSources, getFriendlyErrorMessage } from "@/lib/api";
import { Card, CardText, CardTitle, Badge } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { DatabaseIcon, CheckIcon } from "@/components/ui/icons";

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

function getVerificationStatus(lastVerified: string | null): {
  variant: "success" | "warning" | "danger";
  label: string;
} {
  if (!lastVerified) return { variant: "warning", label: "Not Verified" };

  const verifiedDate = new Date(lastVerified);
  const now = new Date();
  const daysSinceVerification = (now.getTime() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceVerification <= 30) {
    return { variant: "success", label: "Recently Verified" };
  } else if (daysSinceVerification <= 90) {
    return { variant: "warning", label: "Verification Aging" };
  } else {
    return { variant: "danger", label: "Needs Verification" };
  }
}

/** Public listing of the information sources behind platform content. */
export const metadata = {
  title: "Data Sources | GenSan LifeMap",
  description: "The information sources behind GenSan LifeMap content.",
};

export default async function DataSourcesPage() {
  let data = null;
  let error: string | null = null;
  try {
    data = await getDataSources({ per_page: 50 }, { revalidate: 60 });
  } catch (e) {
    error = getFriendlyErrorMessage(e);
  }

  const items = data?.data ?? [];

  return (
    <CollectionPage
      title="Data Sources"
      description="The information sources behind announcements and records on this platform. Listings reflect what is currently tracked in the database with verification status for transparency."
      total={data ? data.meta.total : null}
      totalLabel="Transparency"
      error={error}
      isEmpty={items.length === 0}
      emptyMessage="No data sources have been tracked yet."
    >
      {items.map((d) => {
        const verified = formatDate(d.last_verified_at);
        const verificationStatus = getVerificationStatus(d.last_verified_at);

        return (
          <Card key={d.id} className="flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                  <DatabaseIcon />
                </div>
                <Badge tone="neutral">{d.source_type}</Badge>
              </div>
              <StatusBadge
                variant={verificationStatus.variant}
                icon={verificationStatus.variant === "success" ? <CheckIcon /> : undefined}
              >
                {verificationStatus.label}
              </StatusBadge>
            </div>

            <CardTitle as="h2" className="mt-3">
              {d.name}
            </CardTitle>

            {d.description && (
              <CardText className="line-clamp-3 flex-1 mt-2">
                {d.description}
              </CardText>
            )}

            <div className="mt-4 space-y-2">
              {d.url && (
                <div className="flex items-start gap-2">
                  <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    URL:
                  </span>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-sm text-blue-700 hover:underline dark:text-blue-400"
                  >
                    {d.url}
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                {verified ? (
                  <>
                    <span className="font-medium">Last verified:</span>
                    <time dateTime={d.last_verified_at ?? undefined}>{verified}</time>
                  </>
                ) : (
                  <span className="italic">Verification date not listed</span>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </CollectionPage>
  );
}
