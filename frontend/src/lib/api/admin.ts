import { apiFetch } from "./client";
import type { PaginatedResponse } from "@/types";
import type { CommunityReport } from "@/types/community-report";
import type { AuthUser } from "@/types/user";

export type ManagedResource = "locations" | "projects" | "facilities" | "announcements" | "data-sources";
export type AdminModule = ManagedResource | "community-reports" | "users" | "audit-logs";
export type AdminRecord = Record<string, unknown> & { id: number };

export interface AuditEntry {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  actor: { id: number; name: string } | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminOverview {
  locations: number;
  projects: number;
  facilities: number;
  pending_reports: number;
  announcements: number;
  registered_users: number | null;
  recent_reports: CommunityReport[];
  recent_activity: AuditEntry[];
}

interface DataEnvelope<T> { data: T }

export async function getAdminOverview() {
  return apiFetch<DataEnvelope<AdminOverview>>("/admin/overview", { cache: "no-store" }).then((result) => result.data);
}

export function getAdminResource(resource: ManagedResource, query: { search?: string; status?: string; category?: string; barangay?: string; location_type?: string; source_type?: string; role?: string; page?: number; per_page?: number } = {}) {
  return apiFetch<PaginatedResponse<AdminRecord>>(`/admin/${resource}`, { query: { ...query, per_page: query.per_page ?? 20 }, cache: "no-store" });
}

export function getAdminReports(query: { search?: string; status?: string; category?: string; page?: number; per_page?: number } = {}) {
  return apiFetch<PaginatedResponse<CommunityReport>>("/admin/community-reports", { query: { ...query, per_page: query.per_page ?? 20 }, cache: "no-store" });
}

export function getAdminUsers(query: { search?: string; role?: string; page?: number; per_page?: number } = {}) {
  return apiFetch<PaginatedResponse<AuthUser>>("/admin/users", { query: { ...query, per_page: query.per_page ?? 20 }, cache: "no-store" });
}

export function getAdminAuditLogs(query: { search?: string; entity_type?: string; action?: string; page?: number; per_page?: number } = {}) {
  return apiFetch<PaginatedResponse<AuditEntry>>("/admin/audit-logs", { query: { ...query, per_page: query.per_page ?? 25 }, cache: "no-store" });
}

export async function saveAdminResource(resource: ManagedResource, data: Record<string, unknown>, id?: number) {
  const result = await apiFetch<DataEnvelope<AdminRecord>>(`/admin/${resource}${id ? `/${id}` : ""}`, {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return result.data;
}

export async function getAdminRecord(resource: ManagedResource, id: number) {
  const result = await apiFetch<DataEnvelope<AdminRecord>>(`/admin/${resource}/${id}`, { cache: "no-store" });
  return result.data;
}

export function deleteAdminResource(resource: ManagedResource, id: number) {
  return apiFetch<void>(`/admin/${resource}/${id}`, { method: "DELETE" });
}

export async function updateReportStatus(id: number, status: string) {
  const result = await apiFetch<DataEnvelope<CommunityReport>>(`/community-reports/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return result.data;
}

export async function updateManagedUserRole(id: number, role: string) {
  const result = await apiFetch<DataEnvelope<{ user: AuthUser }>>(`/admin/users/${id}/role`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  return result.data.user;
}
