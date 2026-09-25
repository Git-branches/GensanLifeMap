import CollectionPage from "@/components/collection-page";
import { getFriendlyErrorMessage, getLocations } from "@/lib/api";
import { Card, CardEyebrow, CardMeta, CardText, CardTitle } from "@/components/ui/card";

/** Public listing of places across General Santos City. */
export const metadata = {
  title: "Locations | GenSan LifeMap",
  description: "Discover places and locations across General Santos City.",
};

export default async function LocationsPage() {
  let data = null;
  let error: string | null = null;
  try {
    data = await getLocations({ per_page: 50 }, { revalidate: 60 });
  } catch (e) {
    error = getFriendlyErrorMessage(e);
  }

  const items = data?.data ?? [];

  return (
    <CollectionPage
      title="Locations"
      description="Discover places and locations across General Santos City. "
      total={data ? data.meta.total : null}
      totalLabel="General Santos City"
      error={error}
      isEmpty={items.length === 0}
      emptyMessage="No locations have been listed yet."
    >
      {items.map((l) => (
        <Card key={l.id}>
          <CardEyebrow>{l.location_type}</CardEyebrow>
          <CardTitle as="h2">{l.name}</CardTitle>
          {l.barangay && <CardMeta>Brgy. {l.barangay}</CardMeta>}
          {l.address && <CardText>{l.address}</CardText>}
        </Card>
      ))}
    </CollectionPage>
  );
}
