"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { getDataSources, getLocations } from "@/lib/api";
import {
  getAdminAuditLogs,
  getAdminReports,
  getAdminResource,
  getAdminUsers,
  deleteAdminResource,
  saveAdminResource,
  updateManagedUserRole,
  updateReportStatus,
  type AdminModule as ModuleName,
  type ManagedResource,
} from "@/lib/api/admin";
import { ApiError, getFriendlyErrorMessage } from "@/lib/api/client";
import type { CommunityReportStatus } from "@/types/community-report";

interface Field {
  key: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "date" | "datetime-local";
  required?: boolean;
  options?: { value: string; label: string }[];
}

const STATUSES: Record<string, string> = { submitted: "Submitted", under_review: "Under review", verified: "Verified", resolved: "Resolved", rejected: "Rejected" };
const ROLES = [{ value: "citizen", label: "Resident" }, { value: "moderator", label: "Moderator" }, { value: "admin", label: "Administrator" }];
const PROJECT_STATUSES = ["planned", "procurement", "ongoing", "completed", "delayed", "cancelled"].map((value) => ({ value, label: value.replaceAll("_", " ") }));
const ANNOUNCEMENT_STATUSES = ["draft", "published", "archived"].map((value) => ({ value, label: value }));
const SOURCE_TYPES = ["official", "public_document", "community", "system_generated"].map((value) => ({ value, label: value.replaceAll("_", " ") }));

const FIELDS: Partial<Record<ManagedResource, Field[]>> = {
  locations: [
    { key: "name", label: "Name", required: true }, { key: "address", label: "Address" }, { key: "barangay", label: "Barangay" }, { key: "location_type", label: "Location type", required: true }, { key: "latitude", label: "Latitude", type: "number" }, { key: "longitude", label: "Longitude", type: "number" },
  ],
  projects: [
    { key: "title", label: "Project title", required: true }, { key: "location_id", label: "Location", type: "select", required: true }, { key: "category", label: "Category" }, { key: "status", label: "Status", type: "select", required: true, options: PROJECT_STATUSES }, { key: "description", label: "Description", type: "textarea" }, { key: "budget", label: "Budget", type: "number" }, { key: "contract_amount", label: "Contract amount", type: "number" }, { key: "start_date", label: "Start date", type: "date" }, { key: "target_completion", label: "Target completion", type: "date" }, { key: "completion_percentage", label: "Completion (%)", type: "number", required: true },
  ],
  facilities: [
    { key: "name", label: "Facility name", required: true }, { key: "location_id", label: "Location", type: "select", required: true }, { key: "category", label: "Category" }, { key: "description", label: "Description", type: "textarea" }, { key: "contact_number", label: "Contact number" }, { key: "operating_hours", label: "Operating hours" },
  ],
  announcements: [
    { key: "title", label: "Title", required: true }, { key: "category", label: "Category", required: true }, { key: "content", label: "Announcement text", type: "textarea", required: true }, { key: "source_id", label: "Information source", type: "select" }, { key: "status", label: "Publication status", type: "select", required: true, options: ANNOUNCEMENT_STATUSES }, { key: "published_at", label: "Publish date/time", type: "datetime-local" }, { key: "expires_at", label: "Expiry date/time", type: "datetime-local" },
  ],
  "data-sources": [
    { key: "name", label: "Source name", required: true }, { key: "source_type", label: "Source type", type: "select", required: true, options: SOURCE_TYPES }, { key: "url", label: "URL" }, { key: "description", label: "Description", type: "textarea" }, { key: "last_verified_at", label: "Last verified", type: "datetime-local" },
  ],
};
const TITLES: Record<ModuleName, string> = { locations: "Locations", projects: "Projects", facilities: "Facilities", announcements: "Announcements", "community-reports": "Community reports", "data-sources": "Data sources", users: "User management", "audit-logs": "Audit logs" };

function scalar(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") {
    if ("name" in value) return String((value as { name?: unknown }).name ?? "—");
    return "Details available";
  }
  return String(value).replaceAll("_", " ");
}

function titleOf(row: Record<string, unknown>) {
  return scalar(row.title ?? row.name ?? `Record ${row.id}`);
}

function statusTone(value: unknown) {
  const status = String(value ?? "").toLowerCase();
  if (["resolved", "completed", "published", "verified"].includes(status)) return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (["rejected", "cancelled", "delayed", "archived"].includes(status)) return "bg-rose-50 text-rose-800 ring-rose-200";
  if (["under_review", "ongoing", "procurement"].includes(status)) return "bg-amber-50 text-amber-800 ring-amber-200";
  if (["submitted", "planned", "draft"].includes(status)) return "bg-sky-50 text-sky-800 ring-sky-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function cellValue(key: string, value: unknown) {
  if (["created_at", "published_at", "last_verified_at"].includes(key)) {
    if (!value) return "—";
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
  }
  if (key === "completion_percentage" && typeof value === "number") return `${value}%`;
  return scalar(value);
}

function dateTimeInput(value: unknown) {
  if (typeof value !== "string" || !value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function AdminModule({ module }: { module: ModuleName }) {
  const { user } = useAuth();
  const canManage = user?.role === "admin";
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [editing, setEditing] = useState<Record<string, unknown> | undefined>(undefined);
  const [filterLocations, setFilterLocations] = useState<{ id: number; name: string; barangay: string | null }[]>([]);
  const [filterSources, setFilterSources] = useState<{ id: number; name: string }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let result: { data: unknown[]; meta: { total: number; last_page: number } };
      if (module === "community-reports") result = await getAdminReports({ search, status: statusFilter || undefined, category: categoryFilter || undefined, page: currentPage });
      else if (module === "users") result = await getAdminUsers({ search, role: roleFilter || undefined, page: currentPage });
      else if (module === "audit-logs") result = await getAdminAuditLogs({ search, entity_type: typeFilter || undefined, action: categoryFilter || undefined, page: currentPage });
      else result = await getAdminResource(module, {
        search,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        barangay: areaFilter || undefined,
        location_type: module === "locations" ? typeFilter || undefined : undefined,
        source_type: module === "data-sources" ? typeFilter || undefined : undefined,
        page: currentPage,
      });
      setRows(result.data as Record<string, unknown>[]);
      setTotal(result.meta.total);
      setLastPage(result.meta.last_page);
    } catch (reason) {
      setError(getFriendlyErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, [module, search, statusFilter, roleFilter, categoryFilter, areaFilter, typeFilter, currentPage]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  useEffect(() => {
    if (!canManage || !["projects", "facilities", "announcements"].includes(module)) return;
    if (["projects", "facilities"].includes(module)) void getLocations({ per_page: 50 }).then((result) => setFilterLocations(result.data)).catch(() => setFilterLocations([]));
    if (module === "announcements") void getDataSources({ per_page: 50 }).then((result) => setFilterSources(result.data)).catch(() => setFilterSources([]));
  }, [canManage, module]);

  const fields = useMemo(() => (FIELDS[module as ManagedResource] ?? []).map((field) => {
    if (field.key === "location_id") return { ...field, options: filterLocations.map((location) => ({ value: String(location.id), label: `${location.name}${location.barangay ? ` · ${location.barangay}` : ""}` })) };
    if (field.key === "source_id") return { ...field, options: filterSources.map((source) => ({ value: String(source.id), label: source.name })) };
    return field;
  }), [module, filterLocations, filterSources]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || !FIELDS[module as ManagedResource]) return;
    const formData = new FormData(event.currentTarget);
    const values: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = String(formData.get(field.key) ?? "").trim();
      const nullable = ["address", "barangay", "latitude", "longitude", "description", "budget", "contract_amount", "start_date", "target_completion", "category", "contact_number", "operating_hours", "source_id", "url", "last_verified_at", "published_at", "expires_at"].includes(field.key);
      if (field.type === "number") values[field.key] = raw === "" && nullable ? null : Number(raw);
      else values[field.key] = raw === "" && nullable ? null : raw || "";
    }
    try {
      await saveAdminResource(module as ManagedResource, values, typeof editing.id === "number" ? editing.id : undefined);
      setNotice(typeof editing.id === "number" ? "Changes saved." : "Record created.");
      setEditing(undefined);
      await load();
    } catch (reason) {
      if (reason instanceof ApiError && reason.validationErrors) setError(Object.values(reason.validationErrors).flat().join(" "));
      else setError(getFriendlyErrorMessage(reason));
    }
  }

  async function changeReportStatus(row: Record<string, unknown>, nextStatus: string) {
    const id = Number(row.id);
    if (!id || !window.confirm(`Change report status to “${STATUSES[nextStatus] ?? nextStatus}”?`)) return;
    try {
      await updateReportStatus(id, nextStatus);
      setNotice("Report status updated and added to the audit trail.");
      await load();
    } catch (reason) { setError(getFriendlyErrorMessage(reason)); }
  }

  async function changeRole(row: Record<string, unknown>, nextRole: string) {
    const id = Number(row.id);
    if (!id || !window.confirm(`Change this account's role to ${nextRole}?`)) return;
    try {
      await updateManagedUserRole(id, nextRole);
      setNotice("User role updated.");
      await load();
    } catch (reason) { setError(getFriendlyErrorMessage(reason)); }
  }

  async function deleteRecord(row: Record<string, unknown>) {
    if (!FIELDS[module as ManagedResource]) return;
    const id = Number(row.id);
    if (!id || !window.confirm(`Permanently delete “${titleOf(row)}”? This action cannot be undone.`)) return;
    try {
      await deleteAdminResource(module as ManagedResource, id);
      setNotice("Record deleted and recorded in the audit trail.");
      await load();
    } catch (reason) {
      setError(getFriendlyErrorMessage(reason));
    }
  }

  const hasStatusFilter = module === "projects" || module === "announcements" || module === "community-reports";
  const selectedColumns = module === "locations" ? ["name", "location_type", "barangay"]
    : module === "projects" ? ["title", "status", "category", "completion_percentage"]
    : module === "facilities" ? ["name", "category", "location"]
    : module === "announcements" ? ["title", "status", "category", "published_at"]
    : module === "data-sources" ? ["name", "source_type", "last_verified_at"]
    : module === "community-reports" ? ["title", "category", "status", "created_at"]
    : module === "users" ? ["name", "email", "role", "created_at"]
    : ["action", "entity_type", "entity_id", "actor", "created_at"];

  return (
    <div className="mx-auto max-w-[1440px] lg:flex lg:h-full lg:min-h-0 lg:flex-col">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end"><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-800"><span className="h-1.5 w-1.5 rounded-full bg-teal-500"/>Administration</p><h1 className="mt-1.5 text-[26px] font-bold tracking-tight text-slate-900">{TITLES[module]}</h1><p className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-600">{module === "community-reports" ? "Review resident submissions and update the supported report workflow." : module === "audit-logs" ? "Read-only history of administrative changes." : module === "users" ? "Review registered accounts and manage roles." : `Manage the existing ${TITLES[module].toLowerCase()} records used by the public platform.`}</p></div>{canManage && fields.length > 0 && <button type="button" onClick={() => { setError(null); setEditing({}); }} className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg bg-blue-700 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 sm:self-auto"><span className="text-base leading-none">+</span>Create {TITLES[module].replace(/s$/, "")}</button>}</header>
      <div className="mt-4 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4"><div className="flex flex-col gap-2.5 xl:flex-row"><label className="relative min-w-0 flex-1"><span className="sr-only">Search {TITLES[module]}</span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg><input value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder={`Search ${TITLES[module].toLowerCase()}…`} className="min-h-10 w-full rounded-lg border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" /></label><div className="flex flex-wrap gap-2">{module === "users" && <select value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); setCurrentPage(1); }} aria-label="Filter users by role" className="min-h-10 min-w-32 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"><option value="">All roles</option>{ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select>}{hasStatusFilter && <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setCurrentPage(1); }} aria-label="Filter by status" className="min-h-10 min-w-36 rounded-lg border border-slate-200 bg-white px-3 text-xs capitalize text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"><option value="">All statuses</option>{(module === "community-reports" ? Object.keys(STATUSES) : module === "announcements" ? ["draft", "published", "archived"] : PROJECT_STATUSES.map((status) => status.value)).map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select>}</div></div>
      {(module === "locations" || module === "projects" || module === "facilities" || module === "announcements" || module === "community-reports" || module === "data-sources" || module === "audit-logs") && <div className="mt-2.5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{["projects", "facilities", "announcements", "community-reports", "audit-logs"].includes(module) && <input aria-label={module === "audit-logs" ? "Filter audit action" : "Filter category"} value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setCurrentPage(1); }} placeholder={module === "audit-logs" ? "Action filter…" : "Category filter…"} className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />}{["locations", "projects", "facilities"].includes(module) && <input aria-label="Filter by barangay" value={areaFilter} onChange={(event) => { setAreaFilter(event.target.value); setCurrentPage(1); }} placeholder="Barangay filter…" className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />}{["locations", "data-sources", "audit-logs"].includes(module) && <input aria-label={module === "audit-logs" ? "Filter audit resource" : module === "data-sources" ? "Filter source type" : "Filter location type"} value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setCurrentPage(1); }} placeholder={module === "audit-logs" ? "Resource type filter…" : module === "data-sources" ? "Source type filter…" : "Location type filter…"} className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />}</div>}
      </div>
      <div className="mt-3 flex items-center justify-between px-1 text-[11px] text-slate-500"><span>{loading ? "Loading records…" : <><span className="font-semibold tabular-nums text-slate-700">{total}</span> {TITLES[module].toLowerCase()}</>}</span><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-[11px] font-semibold text-slate-600 transition hover:bg-white hover:text-blue-800 disabled:opacity-50"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5"><path d="M20 7v5h-5 M4 17v-5h5"/><path d="M5.5 9a7 7 0 0 1 12-2L20 12M4 12l2.5 5a7 7 0 0 0 12-2"/></svg>Refresh</button></div>
      {notice && <p role="status" className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}{error && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <section aria-label={TITLES[module]} className="mt-3 flex min-h-0 flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 lg:flex-1">
        {loading ? <div className="space-y-3 p-5">{[0, 1, 2].map((key) => <div key={key} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div> : rows.length === 0 ? <div className="p-10 text-center"><h2 className="font-semibold text-slate-900">No {TITLES[module].toLowerCase()} found</h2><p className="mt-1 text-sm text-slate-500">Try another search or add a record if you have permission.</p></div> : <>
          <div className="hidden min-h-0 overflow-x-auto md:block md:flex-1 md:overflow-y-auto"><table className="w-full min-w-[760px] border-collapse text-left text-[12px]"><thead className="sticky top-0 z-10 bg-[#f5f8fc] text-[10px] uppercase tracking-[0.12em] text-slate-500"><tr>{selectedColumns.map((key) => <th key={key} className="border-b border-slate-200 px-4 py-3.5 font-bold">{key.replaceAll("_", " ")}</th>)}<th className="border-b border-slate-200 px-4 py-3.5 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={String(row.id)} className="group transition-colors hover:bg-[#f8fbff]">{selectedColumns.map((key) => <td key={key} className="max-w-72 px-4 py-3.5 text-slate-700">{key === "status" ? <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ring-1 ring-inset ${statusTone(row[key])}`}>{scalar(row[key])}</span> : <span className="block truncate">{cellValue(key, row[key])}</span>}</td>)}<td className="whitespace-nowrap px-4 py-3 text-right"><div className="flex items-center justify-end gap-1"><button type="button" onClick={() => setSelected(row)} className="rounded-md px-2 py-1.5 text-[11px] font-bold text-blue-800 hover:bg-blue-50">View</button>{fields.length > 0 && canManage && <><button type="button" onClick={() => { setError(null); setEditing(row); }} className="rounded-md px-2 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100">Edit</button><button type="button" onClick={() => void deleteRecord(row)} className="rounded-md px-2 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-50">Delete</button></>}{module === "community-reports" && <select aria-label={`Update report ${String(row.id)} status`} value={String(row.status)} onChange={(event) => void changeReportStatus(row, event.target.value)} className="max-w-32 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-semibold capitalize text-slate-700 outline-none focus:border-blue-400">{Object.entries(STATUSES).map(([value, label]) => <option key={value} value={value} disabled={!nextStatuses(String(row.status)).includes(value as CommunityReportStatus)}>{label}</option>)}</select>}{module === "users" && canManage && <select aria-label={`Change role for ${String(row.name)}`} value={String(row.role)} onChange={(event) => void changeRole(row, event.target.value)} className="max-w-32 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-semibold capitalize text-slate-700 outline-none focus:border-blue-400">{ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select>}</div></td></tr>)}</tbody></table></div>
          <ul className="divide-y divide-slate-100 md:hidden">{rows.map((row) => <li key={String(row.id)} className="p-4 transition-colors hover:bg-slate-50/70"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate text-[13px] font-bold text-slate-900">{titleOf(row)}</h2><p className="mt-1 text-[11px] text-slate-500">{selectedColumns.slice(1, 3).map((key) => cellValue(key, row[key])).join(" · ")}</p>{selectedColumns.includes("status") && <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ring-1 ring-inset ${statusTone(row.status)}`}>{scalar(row.status)}</span>}</div><button type="button" onClick={() => setSelected(row)} className="min-h-9 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-blue-800 shadow-sm">View</button></div>{module === "community-reports" && <select aria-label={`Update report ${String(row.id)} status`} value={String(row.status)} onChange={(event) => void changeReportStatus(row, event.target.value)} className="mt-3 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold">{Object.entries(STATUSES).map(([value, label]) => <option key={value} value={value} disabled={!nextStatuses(String(row.status)).includes(value as CommunityReportStatus)}>{label}</option>)}</select>}{module === "users" && canManage && <select aria-label={`Change role for ${String(row.name)}`} value={String(row.role)} onChange={(event) => void changeRole(row, event.target.value)} className="mt-3 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold">{ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select>}{fields.length > 0 && canManage && <div className="mt-3 flex gap-2"><button type="button" onClick={() => setEditing(row)} className="min-h-9 rounded-lg border border-slate-200 px-3 text-[11px] font-semibold text-slate-700">Edit record</button><button type="button" onClick={() => void deleteRecord(row)} className="min-h-9 rounded-lg border border-rose-200 px-3 text-[11px] font-semibold text-rose-700">Delete</button></div>}</li>)}</ul>
        </>}
      </section>
      {!loading && lastPage > 1 && <nav aria-label="List pages" className="mt-4 flex items-center justify-between rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200"><p className="text-sm text-slate-600">Page {currentPage} of {lastPage}</p><div className="flex gap-2"><button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 disabled:opacity-40">Previous</button><button type="button" disabled={currentPage >= lastPage} onClick={() => setCurrentPage((page) => Math.min(lastPage, page + 1))} className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 disabled:opacity-40">Next</button></div></nav>}

      {selected && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section role="dialog" aria-modal="true" aria-labelledby="admin-detail-title" className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-2xl sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">{TITLES[module]}</p><h2 id="admin-detail-title" className="mt-1 text-xl font-bold text-slate-900">{titleOf(selected)}</h2></div><button type="button" autoFocus onClick={() => setSelected(null)} className="min-h-10 rounded-full border border-slate-300 px-4 text-sm font-semibold">Close</button></div><dl className="mt-5 divide-y divide-slate-100">{Object.entries(selected).filter(([key]) => !["id", "photo_path", "user"].includes(key)).map(([key, value]) => <div key={key} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{key.replaceAll("_", " ")}</dt><dd className="break-words text-sm text-slate-800">{scalar(value)}</dd></div>)}{selected.user !== undefined && selected.user !== null && <div className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted by</dt><dd className="text-sm text-slate-800">{scalar(selected.user)}</dd></div>}</dl></section></div>}

      {editing !== undefined && fields.length > 0 && <AdminEditDialog module={module as ManagedResource} fields={fields} record={editing} onClose={() => setEditing(undefined)} onSave={save} />}
    </div>
  );
}

function nextStatuses(current: string): CommunityReportStatus[] {
  const flow: Record<string, CommunityReportStatus[]> = {
    submitted: ["under_review", "verified", "rejected"],
    under_review: ["verified", "resolved", "rejected"],
    verified: ["resolved", "rejected"],
    resolved: [],
    rejected: [],
  };
  return [current as CommunityReportStatus, ...(flow[current] ?? [])];
}

function AdminEditDialog({ module, fields, record, onClose, onSave }: { module: ManagedResource; fields: Field[]; record: Record<string, unknown>; onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>) => Promise<void> }) {
  const editing = typeof record.id === "number";
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="admin-form-title" className="max-h-[94dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">{editing ? "Edit" : "Create"} · {TITLES[module]}</p><h2 id="admin-form-title" className="mt-1 text-xl font-bold text-slate-900">{editing ? titleOf(record) : `New ${TITLES[module].replace(/s$/, "")}`}</h2></div><button type="button" onClick={onClose} className="min-h-10 rounded-full border border-slate-300 px-4 text-sm font-semibold">Cancel</button></div>
        <form onSubmit={(event) => void onSave(event)} className="mt-5 grid gap-4 sm:grid-cols-2">
          {fields.map((field) => {
            const rawValue = record[field.key];
            const value = field.type === "datetime-local" ? dateTimeInput(rawValue) : rawValue === null || rawValue === undefined ? "" : String(rawValue);
            const common = "mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
            return <label key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}><span className="text-sm font-semibold text-slate-700">{field.label}{field.required ? " *" : ""}</span>{field.type === "textarea" ? <textarea name={field.key} defaultValue={value} required={field.required} maxLength={field.key === "content" ? 20000 : 10000} rows={4} className={`${common} min-h-28 resize-y`} /> : field.type === "select" ? <select name={field.key} defaultValue={value || field.options?.[0]?.value || ""} required={field.required} className={common}><option value="">{field.required ? "Choose…" : "None"}</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input name={field.key} type={field.type ?? "text"} defaultValue={value} required={field.required} min={field.key === "completion_percentage" ? 0 : undefined} max={field.key === "completion_percentage" ? 100 : undefined} step={field.type === "number" ? "any" : undefined} className={common} />}</label>;
          })}
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:col-span-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="min-h-11 rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" className="min-h-11 rounded-full bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800">{editing ? "Save changes" : "Create record"}</button></div>
        </form>
      </section>
    </div>
  );
}
