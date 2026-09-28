import Link from "next/link";
import CollectionPage from "@/components/collection-page";
import { getFriendlyErrorMessage, getLocations } from "@/lib/api";
import { Card, CardMeta, CardText, CardTitle, CardActions, Badge } from "@/components/ui/card";
import { ArrowRightIcon, PinIcon, MapIcon } from "@/components/ui/icons";

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
      description="Discover places and locations across General Santos City. Browse by type, explore neighborhoods, and find key destinations."
      total={data ? data.meta.total : null}
      totalLabel="General Santos City"
      error={error}
      isEmpty={items.length === 0}
      emptyMessage="No locations have been listed yet."
    >
      {items.map((l) => (
        <Card key={l.id} className="group transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <PinIcon />
              </div>
              <Badge tone="info">{l.location_type}</Badge>
            </div>
          </div>

          <CardTitle as="h2" className="mt-3">
            <Link
              href={`/locations/${l.id}`}
              className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
            >
              {l.name}
            </Link>
          </CardTitle>

          {l.barangay && (
            <CardMeta>
              <span className="inline-flex items-center gap-1">
                Brgy. {l.barangay}
              </span>
            </CardMeta>
          )}

          {l.address && (
            <CardText className="mt-2 line-clamp-2">
              {l.address}
            </CardText>
          )}

          <CardActions className="mt-4 justify-between">
            <Link
              href={`/locations/${l.id}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View Details <ArrowRightIcon />
            </Link>

            {l.latitude && l.longitude && (
              <Link
                href={`/map?focus=${l.id}&type=location`}
                className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                title="View on map"
              >
                <MapIcon />
                <span className="sr-only">View on map</span>
              </Link>
            )}
          </CardActions>
        </Card>
      ))}
    </CollectionPage>
  );
}
