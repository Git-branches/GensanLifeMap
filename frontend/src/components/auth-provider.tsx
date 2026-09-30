"use client";

/**
 * Centralized frontend auth state. One provider (mounted in the root
 * layout) owns the session; pages consume it via `useAuth()` instead
 * of duplicating session logic.
 *
 * States: checking (session resolving) · authenticated · unauthenticated.
 * These drive UX only — Laravel enforces authentication on every
 * protected endpoint regardless of what this state claims.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  loginAccount,
  logoutAccount,
  registerAccount,
  resolveStoredSession,
  type ChangePasswordInput,
  type LoginInput,
  type RegisterInput,
  type UpdateProfileInput,
} from "@/lib/api/auth";
import type { AuthStatus, AuthUser } from "@/types/user";

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  signIn: (input: LoginInput) => Promise<AuthUser>;
  signUp: (input: RegisterInput) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [user, setUser] = useState<AuthUser | null>(null);

  const resolveSession = useCallback(async () => {
    const account = await resolveStoredSession();
    setUser(account);
    setStatus(account ? "authenticated" : "unauthenticated");
  }, []);

  // Initial session bootstrap: state updates happen inside the promise
  // continuation (a subscription-style callback), never synchronously
  // in the effect body.
  useEffect(() => {
    let cancelled = false;
    resolveStoredSession().then((account) => {
      if (cancelled) return;
      setUser(account);
      setStatus(account ? "authenticated" : "unauthenticated");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Cross-tab consistency: signing out (or in) elsewhere updates this tab.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "glm_token") void resolveSession();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [resolveSession]);

  const signIn = useCallback(async (input: LoginInput) => {
    const account = await loginAccount(input);
    setUser(account);
    setStatus("authenticated");
    return account;
  }, []);

  const signUp = useCallback(async (input: RegisterInput) => {
    const account = await registerAccount(input);
    setUser(account);
    setStatus("authenticated");
    return account;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logoutAccount();
    } catch {
      // logoutAccount clears the local token in its finally block; preserve
      // the signed-out UI even if the API is temporarily unavailable.
    }
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const refreshUser = useCallback(async () => {
    await resolveSession();
  }, [resolveSession]);

  const value = useMemo(
    () => ({ status, user, signIn, signUp, signOut, refreshUser }),
    [status, user, signIn, signUp, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>.");
  return ctx;
}

export type { ChangePasswordInput, LoginInput, RegisterInput, UpdateProfileInput };
