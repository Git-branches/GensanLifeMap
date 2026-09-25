import CollectionPage from "@/components/collection-page";
import { getFriendlyErrorMessage, getProjects } from "@/lib/api";
import { Card, CardEyebrow, CardMeta, CardText, CardTitle } from "@/components/ui/card";

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
      description="Publicly listed projects and their current information, as recorded in the database. "
      total={data ? data.meta.total : null}
      totalLabel="Transparency"
      error={error}
      isEmpty={items.length === 0}
      emptyMessage="No projects have been listed yet."
    >
      {items.map((p) => (
        <Card key={p.id} className="flex flex-col">
          <CardEyebrow>
            {p.category} · {p.status}
          </CardEyebrow>
          <CardTitle as="h2">{p.title}</CardTitle>
          {p.location?.barangay && (
            <CardMeta>Brgy. {p.location.barangay}</CardMeta>
          )}
          {p.description && (
            <CardText className="line-clamp-3 flex-1">{p.description}</CardText>
          )}
          <CardMeta>
            <span className="mt-3 block">
              Completion: {p.completion_percentage}%
              {p.target_completion ? ` · Target: ${p.target_completion}` : ""}
            </span>
          </CardMeta>
        </Card>
      ))}
    </CollectionPage>
  );
}
