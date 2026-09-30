/** Authenticated account as returned by the API (safe fields only). */
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  email_verified_at: string | null;
  created_at: string;
}

export type AuthStatus = "checking" | "authenticated" | "unauthenticated";

export interface AuthSession {
  user: AuthUser;
  token: string;
}
