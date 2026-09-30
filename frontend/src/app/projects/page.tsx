import Link from "next/link";
import CollectionPage from "@/components/collection-page";
import { getFriendlyErrorMessage, getProjects } from "@/lib/api";
import { Card, CardEyebrow, CardMeta, CardText, CardTitle, CardActions, CardBadgeGroup } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge, getStatusVariant } from "@/components/ui/status-badge";
import { ArrowRightIcon, PinIcon } from "@/components/ui/icons";

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

/** Public listing of publicly listed projects and their status. */
export const metadata = {
  title: "Projects | GenSan LifeMap",
  description: "Explore publicly listed projects and their current information.",
};

export default async function ProjectsPage() {
  let data = null;
  let error: string | null = null;
  try {
    data = await getProjects({ per_page: 50 }, { revalidate: 60 });
  } catch (e) {
    error = getFriendlyErrorMessage(e);
  }

  const items = data?.data ?? [];

  return (
    <CollectionPage
      title="Public Projects"
      description="Publicly listed projects and their current information, as recorded in the database. Track progress, status, and completion timelines across the city."
      total={data ? data.meta.total : null}
      totalLabel="Transparency"
      error={error}
      isEmpty={items.length === 0}
      emptyMessage="No projects have been listed yet."
    >
      {items.map((p) => {
        const targetDate = formatDate(p.target_completion);
        const startDate = formatDate(p.start_date);

        return (
          <Card key={p.id} className="flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <CardBadgeGroup>
                <CardEyebrow>{p.category}</CardEyebrow>
                <StatusBadge variant={getStatusVariant(p.status)}>
                  {p.status}
                </StatusBadge>
              </CardBadgeGroup>
            </div>

            <CardTitle as="h2" className="mt-3">
              <Link
                href={`/projects/${p.id}`}
                className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
              >
                {p.title}
              </Link>
            </CardTitle>

            {p.location?.barangay && (
              <CardMeta>
                <span className="inline-flex items-center gap-1">
                  <PinIcon />
                  Brgy. {p.location.barangay}
                </span>
              </CardMeta>
            )}

            {p.description && (
              <CardText className="line-clamp-3 flex-1 mt-2">
                {p.description}
              </CardText>
            )}

            <div className="mt-4 space-y-3">
              <ProgressBar
                value={p.completion_percentage}
                max={100}
                size="md"
                showLabel
              />

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                {startDate && (
                  <span>Started: {startDate}</span>
                )}
                {targetDate && (
                  <span>Target: {targetDate}</span>
                )}
              </div>
            </div>

            <CardActions>
              <Link
                href={`/projects/${p.id}`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View Details <ArrowRightIcon />
              </Link>
            </CardActions>
          </Card>
        );
      })}
    </CollectionPage>
  );
}
