import { notFound } from "next/navigation";
import AdminModule from "@/components/admin/admin-module";
import type { AdminModule as ModuleName } from "@/lib/api/admin";

const MODULES = new Set<ModuleName>([
  "locations",
  "projects",
  "facilities",
  "announcements",
  "community-reports",
  "data-sources",
  "users",
  "audit-logs",
]);

export default async function AdminModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  if (!MODULES.has(module as ModuleName)) notFound();
  return <AdminModule module={module as ModuleName} />;
}
