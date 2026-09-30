import Link from "next/link";
import CollectionPage from "@/components/collection-page";
import { getFacilities, getFriendlyErrorMessage } from "@/lib/api";
import { Card, CardMeta, CardText, CardTitle, CardActions, Badge } from "@/components/ui/card";
import { ArrowRightIcon, FacilityIcon, PinIcon, MapIcon } from "@/components/ui/icons";

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
      description="Important public and community facilities across the city. Find contact information, operating hours, and locations for essential services."
      total={data ? data.meta.total : null}
      totalLabel="General Santos City"
      error={error}
      isEmpty={items.length === 0}
      emptyMessage="No facilities have been listed yet."
    >
      {items.map((f) => (
        <Card key={f.id} className="flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                <FacilityIcon />
              </div>
              <Badge tone="warning">{f.category}</Badge>
            </div>
          </div>

          <CardTitle as="h2" className="mt-3">
            <Link
              href={`/facilities/${f.id}`}
              className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
            >
              {f.name}
            </Link>
          </CardTitle>

          {f.location?.barangay && (
            <CardMeta>
              <span className="inline-flex items-center gap-1">
                <PinIcon />
                Brgy. {f.location.barangay}
              </span>
            </CardMeta>
          )}

          {f.description && (
            <CardText className="line-clamp-3 flex-1 mt-2">
              {f.description}
            </CardText>
          )}

          {(f.contact_number || f.operating_hours) && (
            <div className="mt-3 space-y-1 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
              {f.contact_number && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    Contact:
                  </span>
                  <a
                    href={`tel:${f.contact_number}`}
                    className="text-blue-700 hover:underline dark:text-blue-400"
                  >
                    {f.contact_number}
                  </a>
                </div>
              )}
              {f.operating_hours && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    Hours:
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {f.operating_hours}
                  </span>
                </div>
              )}
            </div>
          )}

          <CardActions className="mt-4 justify-between">
            <Link
              href={`/facilities/${f.id}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View Details <ArrowRightIcon />
            </Link>

            {f.location?.latitude && f.location?.longitude && (
              <Link
                href={`/map?focus=${f.id}&type=facility`}
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
