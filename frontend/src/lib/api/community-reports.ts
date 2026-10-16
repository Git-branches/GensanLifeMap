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
  const { photo, ...fields } = input;

  // A photo needs multipart; the browser sets the Content-Type boundary.
  let init: { headers?: Record<string, string>; body: string | FormData };
  if (photo) {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) form.append(key, String(value));
    }
    form.append("photo", photo);
    init = { body: form };
  } else {
    init = { headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields) };
  }

  const response = await apiFetch<{ data: CommunityReport }>("/community-reports", {
    method: "POST",
    ...init,
  });
  return response.data;
}
