"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import AuthPanel, { type AuthMode } from "@/components/auth-panel";
import AuthShell from "@/components/auth-shell";
import { useAuth } from "@/components/auth-provider";
import type { AuthUser } from "@/types/user";

function destinationFor(account: Pick<AuthUser, "role"> | null, safeNextPath: string | null) {
  if (account?.role === "admin" || account?.role === "moderator") {
    return safeNextPath?.startsWith("/admin") ? safeNextPath : "/admin";
  }
  return safeNextPath ?? "/dashboard";
}

/**
 * Full-page sign-in / register (the target of `?next=` guard redirects).
 * /login and /register render this with a different starting mode; the
 * tabs switch in place and keep the address bar in step without a
 * navigation.
 */
export default function AuthPage({ initialMode }: { initialMode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, user } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const nextPath = searchParams.get("next");
  const safeNextPath = nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : null;

  useEffect(() => {
    if (status === "authenticated") router.replace(destinationFor(user, safeNextPath));
  }, [status, user, router, safeNextPath]);

  const changeMode = (next: AuthMode) => {
    setMode(next);
    const query = searchParams.toString();
    window.history.replaceState(null, "", `${next === "login" ? "/login" : "/register"}${query ? `?${query}` : ""}`);
  };

  return (
    <AuthShell>
      {status === "authenticated" ? (
        <p className="text-sm text-slate-600">You are already signed in. Redirecting…</p>
      ) : (
        <AuthPanel
          mode={mode}
          onModeChange={changeMode}
          autoFocus
          onSuccess={(account) => {
            router.replace(destinationFor(account, safeNextPath));
            router.refresh();
          }}
        />
      )}
    </AuthShell>
  );
}
