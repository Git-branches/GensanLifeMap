import { clearAuthToken, getAuthToken, setAuthToken } from "../auth-token";
import { ApiError, apiFetch } from "./client";
import type { AuthSession, AuthUser } from "@/types/user";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
}

export interface ChangePasswordInput {
  current_password: string;
  password: string;
  password_confirmation: string;
}

interface SessionEnvelope {
  data: AuthSession;
}

interface UserEnvelope {
  data: AuthUser;
}

/**
 * Create a citizen account. Persists the issued token so the new
 * account is signed in immediately.
 */
export async function registerAccount(input: RegisterInput): Promise<AuthUser> {
  const body = await apiFetch<SessionEnvelope>("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    auth: false,
  });
  setAuthToken(body.data.token);
  return body.data.user;
}

/**
 * Verify credentials. Persists the issued session token.
 */
export async function loginAccount(input: LoginInput): Promise<AuthUser> {
  const body = await apiFetch<SessionEnvelope>("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    auth: false,
  });
  setAuthToken(body.data.token);
  return body.data.user;
}

/**
 * Revoke the current session token on the backend, then clear local
 * auth state. Local state clears even if the backend call fails so a
 * dead token can never leave the UI signed in.
 */
export async function logoutAccount(): Promise<void> {
  try {
    await apiFetch("/logout", { method: "POST" });
  } finally {
    clearAuthToken();
  }
}

/** Load the currently authenticated user (throws 401 when signed out). */
export async function getCurrentUser(): Promise<AuthUser> {
  const body = await apiFetch<UserEnvelope>("/user", { cache: "no-store" });
  return body.data;
}

/**
 * Resolve the stored session to a user, or null when signed out.
 * A dead token (401/403) is discarded so callers can never treat it
 * as a live session. Pure async helper — no React state involved,
 * so effects may consume it inside subscription callbacks.
 */
export async function resolveStoredSession(): Promise<AuthUser | null> {
  if (!getAuthToken()) return null;
  try {
    return await getCurrentUser();
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      clearAuthToken();
    }
    return null;
  }
}

/** Update the signed-in user's own name/email. Role is never accepted. */
export async function updateProfile(input: UpdateProfileInput): Promise<AuthUser> {
  const body = await apiFetch<{ data: { user: AuthUser } }>("/user/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return body.data.user;
}

/** Change the signed-in user's password after verifying the current one. */
export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await apiFetch("/user/password", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
