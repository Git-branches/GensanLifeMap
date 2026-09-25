import CollectionPage from "@/components/collection-page";
import { getAnnouncements, getFriendlyErrorMessage } from "@/lib/api";
import { Card, CardEyebrow, CardMeta, CardText, CardTitle } from "@/components/ui/card";

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
      description="Community announcements and public information. Each announcement is linked to its information source. "
      total={data ? data.meta.total : null}
      totalLabel="Public information"
      error={error}
      isEmpty={items.length === 0}
      emptyMessage="No announcements have been published yet."
    >
      {items.map((a) => {
        const date = formatDate(a.published_at ?? a.created_at);
        return (
          <Card key={a.id} className="flex flex-col">
            <CardEyebrow>
              {a.category}
              {date ? ` · ${date}` : ""}
            </CardEyebrow>
            <CardTitle as="h2">{a.title}</CardTitle>
            {a.content && (
              <CardText className="line-clamp-4 flex-1">{a.content}</CardText>
            )}
            {a.source && (
              <CardMeta>
                <span className="mt-3 block">Source: {a.source.name}</span>
              </CardMeta>
            )}
          </Card>
        );
      })}
    </CollectionPage>
  );
}
