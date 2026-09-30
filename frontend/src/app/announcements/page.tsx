import Link from "next/link";
import CollectionPage from "@/components/collection-page";
import { getAnnouncements, getFriendlyErrorMessage } from "@/lib/api";
import { Card, CardText, CardTitle, CardActions, categoryTone, Badge } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowRightIcon, AnnounceIcon } from "@/components/ui/icons";

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

function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt);
  const now = new Date();
  const daysUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

/** Public listing of published announcements. */
export const metadata = {
  title: "Announcements | GenSan LifeMap",
  description: "Community announcements and public information for General Santos City.",
};

export default async function AnnouncementsPage() {
  let data = null;
  let error: string | null = null;
  try {
    data = await getAnnouncements({ per_page: 50 }, { revalidate: 60 });
  } catch (e) {
    error = getFriendlyErrorMessage(e);
  }

  const items = data?.data ?? [];

  return (
    <CollectionPage
      title="Announcements"
      description="Community announcements and public information. Each announcement is linked to its information source for transparency and verification."
      total={data ? data.meta.total : null}
      totalLabel="Public information"
      error={error}
      isEmpty={items.length === 0}
      emptyMessage="No announcements have been published yet."
    >
      {items.map((a) => {
        const date = formatDate(a.published_at ?? a.created_at);
        const expiryDate = formatDate(a.expires_at);
        const expired = isExpired(a.expires_at);
        const expiringSoon = isExpiringSoon(a.expires_at);

        return (
          <Card
            key={a.id}
            className={`flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
              expired ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  <AnnounceIcon />
                </div>
                <Badge tone={categoryTone(a.category)}>
                  {a.category.replace(/_/g, " ").toUpperCase()}
                </Badge>
                {expired && (
                  <StatusBadge variant="neutral">Expired</StatusBadge>
                )}
                {expiringSoon && !expired && (
                  <StatusBadge variant="warning">Expiring Soon</StatusBadge>
                )}
              </div>
              {date && (
                <time className="shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {date}
                </time>
              )}
            </div>

            <CardTitle as="h2" className="mt-3">
              {a.title}
            </CardTitle>

            {a.content && (
              <CardText className="line-clamp-4 flex-1 mt-2">
                {a.content}
              </CardText>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
              {a.source && (
                <span className="font-medium">
                  Source: {a.source.name}
                </span>
              )}
              {expiryDate && !expired && (
                <span>
                  Valid until: {expiryDate}
                </span>
              )}
            </div>

            <CardActions className="mt-4">
              <Link
                href={`/announcements/${a.id}`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Read More <ArrowRightIcon />
              </Link>
            </CardActions>
          </Card>
        );
      })}
    </CollectionPage>
  );
}
