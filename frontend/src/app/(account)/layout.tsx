import type { ReactNode } from "react";
import UserShell from "@/components/account/user-shell";
import { ScopedThemeProvider } from "@/components/theme-provider";

export const metadata = { title: "My workspace | GenSan LifeMap" };

/**
 * Resident workspace: dashboard, reports and profile share one shell
 * (sidebar + top bar) and the scoped user theme — the signed-in
 * counterpart of /admin. URLs are unchanged by the route group.
 */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <ScopedThemeProvider scope="user">
      <UserShell>{children}</UserShell>
    </ScopedThemeProvider>
  );
}
