"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useReports } from "@/components/account/reports-provider";
import { useAuth } from "@/components/auth-provider";
import { getLocations } from "@/lib/api/locations";
import { createCommunityReport } from "@/lib/api/community-reports";
import { ApiError, getFriendlyErrorMessage } from "@/lib/api/client";
import { formatDistance, nearestTo, type LatLng } from "@/lib/geo";
import { prepareImageForUpload } from "@/lib/image";
import type { Location } from "@/types";

const CATEGORIES = ["road", "flooding", "garbage", "streetlight", "accessibility", "environment", "other"];
const MAX_PHOTO_INPUT = 15 * 1024 * 1024;

const LocationPicker = dynamic(() => import("@/components/lifemap/location-picker"), {
  ssr: false,
  loading: () => <div className="flex h-72 w-full items-center justify-center bg-slate-100 text-sm text-slate-500 dark:bg-slate-800">Loading map…</div>,
});

const CARD = "overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/90 dark:bg-slate-900 dark:ring-slate-800";
const CONTROL = "mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-900";
const LABEL = "block text-sm font-semibold text-slate-800 dark:text-slate-200";
const FIELD_ERROR = "mt-1 text-sm text-red-700 dark:text-red-300";

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className={`${CARD} p-5 sm:p-6`}>
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">{n}</span>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{hint}</p>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function NewReportPage() {
  const router = useRouter();
  const { status } = useAuth();
  const { refresh } = useReports();
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState("");
  const [locationTouched, setLocationTouched] = useState(false);
  const [pin, setPin] = useState<LatLng | null>(null);
  const [flyTarget, setFlyTarget] = useState<LatLng | null>(null);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [category, setCategory] = useState("road");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<{ file: File; url: string } | null>(null);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const photoUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    getLocations({ per_page: 50 })
      .then((result) => setLocations(result.data))
      .catch((reason: unknown) => setError(getFriendlyErrorMessage(reason)))
      .finally(() => setLoadingLocations(false));
  }, [status]);

  // Release the preview's object URL when leaving the page.
  useEffect(() => () => { if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current); }, []);

  const nearest = useMemo(() => (pin ? nearestTo(pin, locations) : null), [pin, locations]);
  // Until the resident picks a place by hand, follow the pin. Derived (not
  // copied into state) so it also works when the pin is dropped before the
  // places list has finished loading.
  const effectiveLocationId = !locationTouched && nearest ? String(nearest.item.id) : locationId;

  function placePin(position: LatLng) {
    setPin(position);
    setGeoMessage(null);
  }

  function useMyLocation() {
    setGeoMessage(null);
    if (!("geolocation" in navigator)) {
      setGeoMessage("Your browser can't share its location. Tap the map instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (result) => {
        const position = { lat: result.coords.latitude, lng: result.coords.longitude };
        placePin(position);
        setFlyTarget({ ...position });
        setLocating(false);
      },
      (failure) => {
        setLocating(false);
        setGeoMessage(
          failure.code === failure.PERMISSION_DENIED
            ? "Location access was blocked. You can allow it in your browser, or tap the map instead."
            : "We couldn't find your location. Tap the map instead.",
        );
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  async function onPhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    setPhotoMessage(null);
    if (!file.type.startsWith("image/")) {
      setPhotoMessage("Choose an image file (JPG or PNG).");
      return;
    }
    if (file.size > MAX_PHOTO_INPUT) {
      setPhotoMessage("That photo is too large. Choose one under 15 MB.");
      return;
    }
    setPhotoBusy(true);
    const prepared = await prepareImageForUpload(file);
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    const url = URL.createObjectURL(prepared);
    photoUrlRef.current = url;
    setPhoto({ file: prepared, url });
    setPhotoBusy(false);
  }

  function removePhoto() {
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    photoUrlRef.current = null;
    setPhoto(null);
    setPhotoMessage(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    if (!effectiveLocationId || !title.trim()) {
      setFieldErrors({
        ...(!effectiveLocationId ? { location_id: ["Drop a pin on the map or choose a listed place."] } : {}),
        ...(!title.trim() ? { title: ["Enter a report title."] } : {}),
      });
      return;
    }
    setSubmitting(true);
    try {
      await createCommunityReport({
        location_id: Number(effectiveLocationId),
        category,
        title: title.trim(),
        description: description.trim() || undefined,
        ...(pin ? { latitude: Number(pin.lat.toFixed(7)), longitude: Number(pin.lng.toFixed(7)) } : {}),
        ...(photo ? { photo: photo.file } : {}),
      });
      await refresh();
      router.replace("/reports?submitted=1");
    } catch (reason) {
      if (reason instanceof ApiError && reason.validationErrors) setFieldErrors(reason.validationErrors);
      else setError(getFriendlyErrorMessage(reason));
      setSubmitting(false);
    }
  }

  const errorFor = (field: string) => fieldErrors[field]?.[0];
  const farFromAnything = nearest && nearest.meters > 3000;

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-800 dark:text-blue-300">Community</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">Report an issue</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">Tell the city what is wrong. Staff review it, and you can follow each step under My reports.</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="grid items-start gap-6 lg:grid-cols-2">
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200 lg:col-span-2">{error}</p>}

        <Step n={1} title="Where is it?" hint="Tap the map to drop a pin on the exact spot. You can drag the pin to adjust it.">
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <LocationPicker value={pin} onChange={placePin} flyTarget={flyTarget} className="h-80 w-full lg:h-[26rem]" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={useMyLocation} disabled={locating || submitting} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
              {locating && <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-700" />}
              {locating ? "Finding you…" : "Use my current location"}
            </button>
            {pin && <button type="button" onClick={() => { setPin(null); setLocationTouched(false); }} className="min-h-10 rounded-full px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Clear pin</button>}
          </div>
          {geoMessage && <p role="status" className="mt-2 text-sm text-amber-700 dark:text-amber-300">{geoMessage}</p>}

          <div className="mt-5">
            <label htmlFor="report-location" className={LABEL}>Nearest listed place</label>
            <select
              id="report-location"
              className={CONTROL}
              value={effectiveLocationId}
              onChange={(event) => { setLocationId(event.target.value); setLocationTouched(true); }}
              disabled={loadingLocations || submitting}
              aria-invalid={Boolean(errorFor("location_id"))}
              aria-describedby="report-location-hint"
            >
              <option value="">{loadingLocations ? "Loading places…" : "Choose a listed place"}</option>
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name}{location.barangay ? ` · ${location.barangay}` : ""}</option>)}
            </select>
            <p id="report-location-hint" className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {nearest && !locationTouched
                ? `Matched automatically: ${nearest.item.name}, about ${formatDistance(nearest.meters)} from your pin.${farFromAnything ? " That is far away, so check it is the right area." : ""}`
                : "Reports are filed under a listed place so the right office can find them."}
            </p>
            {errorFor("location_id") && <p className={FIELD_ERROR}>{errorFor("location_id")}</p>}
            {errorFor("latitude") && <p className={FIELD_ERROR}>{errorFor("latitude")}</p>}
          </div>
        </Step>

        <div className="space-y-6">
        <Step n={2} title="What is the issue?">
          <div className="space-y-5">
            <div>
              <label htmlFor="report-category" className={LABEL}>Category</label>
              <select id="report-category" className={CONTROL} value={category} onChange={(event) => setCategory(event.target.value)} disabled={submitting}>
                {CATEGORIES.map((item) => <option key={item} value={item}>{item.charAt(0).toUpperCase() + item.slice(1)}</option>)}
              </select>
              {errorFor("category") && <p className={FIELD_ERROR}>{errorFor("category")}</p>}
            </div>
            <div>
              <label htmlFor="report-title" className={LABEL}>Report title</label>
              <input id="report-title" className={CONTROL} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={255} required disabled={submitting} placeholder="e.g. Deep pothole near the market entrance" aria-invalid={Boolean(errorFor("title"))} />
              {errorFor("title") && <p className={FIELD_ERROR}>{errorFor("title")}</p>}
            </div>
            <div>
              <label htmlFor="report-description" className={LABEL}>Details <span className="font-normal text-slate-500 dark:text-slate-400">(optional)</span></label>
              <textarea id="report-description" className={`${CONTROL} min-h-28 resize-y`} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} disabled={submitting} />
              <p className="mt-1 text-right text-xs text-slate-500 dark:text-slate-400">{description.length}/5000</p>
              {errorFor("description") && <p className={FIELD_ERROR}>{errorFor("description")}</p>}
            </div>
          </div>
        </Step>

        <Step n={3} title="Add a photo" hint="Optional, but it helps staff understand the problem faster. Large photos are resized for you.">
          {photo ? (
            <div className="flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not optimisable */}
              <img src={photo.url} alt="Preview of the photo you are attaching" className="h-28 w-28 rounded-xl border border-slate-200 object-cover dark:border-slate-700" />
              <div className="min-w-0 text-sm">
                <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{photo.file.name}</p>
                <p className="text-slate-500 dark:text-slate-400">{(photo.file.size / 1024).toFixed(0)} KB</p>
                <button type="button" onClick={removePhoto} disabled={submitting} className="mt-2 min-h-10 rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Remove photo</button>
              </div>
            </div>
          ) : (
            <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-600 transition-colors hover:border-blue-500 hover:bg-blue-50/50 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800/50">
              <span className="font-semibold text-blue-800 dark:text-blue-300">{photoBusy ? "Preparing photo…" : "Choose a photo"}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">JPG or PNG. On a phone you can take one now.</span>
              <input type="file" accept="image/*" onChange={(event) => void onPhotoChange(event)} disabled={submitting || photoBusy} className="sr-only" />
            </label>
          )}
          {photoMessage && <p role="alert" className={FIELD_ERROR}>{photoMessage}</p>}
          {errorFor("photo") && <p className={FIELD_ERROR}>{errorFor("photo")}</p>}
        </Step>
        </div>

        <div className={`${CARD} flex flex-col-reverse gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 lg:col-span-2`}>
          <p className="text-sm text-slate-500 dark:text-slate-400">Every submission is reviewed by city staff.</p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Link href="/reports" className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</Link>
          <button type="submit" disabled={submitting || photoBusy || loadingLocations || locations.length === 0} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-blue-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60">
            {submitting && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {submitting ? "Sending…" : "Submit"}
          </button>
          </div>
        </div>
      </form>
    </div>
  );
}
