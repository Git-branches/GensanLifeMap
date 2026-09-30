import type { ReactNode } from "react";
import AdminShell from "@/components/admin/admin-shell";
import { ScopedThemeProvider } from "@/components/theme-provider";

export const metadata = { title: "Management | GenSan LifeMap" };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ScopedThemeProvider scope="admin">
      <AdminShell>{children}</AdminShell>
    </ScopedThemeProvider>
  );
}
