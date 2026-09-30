import { apiFetch } from "./client";
import type { CommunityReport, CreateCommunityReportInput } from "@/types/community-report";
import type { PaginatedResponse } from "@/types";

export function getMyReports() {
  return apiFetch<PaginatedResponse<CommunityReport>>("/community-reports/mine", {
    query: { per_page: 50 },
    cache: "no-store",
  });
}

export async function getMyReport(id: number) {
  const response = await apiFetch<{ data: CommunityReport }>(`/community-reports/${id}`, {
    cache: "no-store",
  });
  return response.data;
}

export async function createCommunityReport(input: CreateCommunityReportInput) {
  const response = await apiFetch<{ data: CommunityReport }>("/community-reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return response.data;
}
