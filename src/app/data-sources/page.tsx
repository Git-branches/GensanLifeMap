import CollectionPage from "@/components/collection-page";
import { getDataSources, getFriendlyErrorMessage } from "@/lib/api";
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
      description="The information sources behind announcements and records on this platform. Listings reflect what is currently tracked in the database. "
      total={data ? data.meta.total : null}
      totalLabel="Transparency"
      error={error}
      isEmpty={items.length === 0}
      emptyMessage="No data sources have been tracked yet."
    >
      {items.map((d) => {
        const verified = formatDate(d.last_verified_at);
        return (
          <Card key={d.id} className="flex flex-col">
            <CardEyebrow>{d.source_type}</CardEyebrow>
            <CardTitle as="h2">{d.name}</CardTitle>
            {d.description && (
              <CardText className="line-clamp-3 flex-1">{d.description}</CardText>
            )}
            <CardMeta>
              <span className="mt-3 block">
                {d.url ? (
                  <>
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:underline dark:text-blue-400"
                    >
                      Visit source
                    </a>
                    {verified ? ` · Verified ${verified}` : ""}
                  </>
                ) : (
                  verified ? `Last verified ${verified}` : "Verification date not listed"
                )}
              </span>
            </CardMeta>
          </Card>
        );
      })}
    </CollectionPage>
  );
}
