/**
 * Sanctum Bearer token storage. The token lives in localStorage; a
 * non-secret `glm_token=1` cookie is only a routing hint for Next.js.
 * The cookie is NOT an authentication credential or security boundary —
 * Laravel enforces the bearer token on every protected endpoint.
 */

const TOKEN_KEY = "glm_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, matching a week-long session

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function getAuthToken(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Private-mode storage failure: cookie mirror still enables routing;
    // API calls will simply be unauthenticated until sign-in succeeds.
  }
  document.cookie =
    `${TOKEN_KEY}=1; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
}

export function clearAuthToken(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore — cookie below is cleared regardless.
  }
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}
