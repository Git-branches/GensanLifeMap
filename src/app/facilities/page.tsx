import CollectionPage from "@/components/collection-page";
import { getFacilities, getFriendlyErrorMessage } from "@/lib/api";
import { Card, CardEyebrow, CardMeta, CardText, CardTitle } from "@/components/ui/card";

/** Public listing of public and community facilities. */
export const metadata = {
  title: "Facilities | GenSan LifeMap",
  description: "Find important public and community facilities in General Santos City.",
};

export default async function FacilitiesPage() {
  let data = null;
  let error: string | null = null;
  try {
    data = await getFacilities({ per_page: 50 }, { revalidate: 60 });
  } catch (e) {
    error = getFriendlyErrorMessage(e);
  }

  const items = data?.data ?? [];

  return (
    <CollectionPage
      title="Facilities"
      description="Important public and community facilities across the city. "
      total={data ? data.meta.total : null}
      totalLabel="General Santos City"
      error={error}
      isEmpty={items.length === 0}
      emptyMessage="No facilities have been listed yet."
    >
      {items.map((f) => (
        <Card key={f.id} className="flex flex-col">
          <CardEyebrow>{f.category}</CardEyebrow>
          <CardTitle as="h2">{f.name}</CardTitle>
          {f.location?.barangay && (
            <CardMeta>Brgy. {f.location.barangay}</CardMeta>
          )}
          {f.description && (
            <CardText className="line-clamp-3 flex-1">{f.description}</CardText>
          )}
          {(f.contact_number || f.operating_hours) && (
            <CardMeta>
              <span className="mt-3 block">
                {[f.contact_number, f.operating_hours].filter(Boolean).join(" · ")}
              </span>
            </CardMeta>
          )}
        </Card>
      ))}
    </CollectionPage>
  );
}
