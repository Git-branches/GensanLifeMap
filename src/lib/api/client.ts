/**
 * Central API client for the Laravel REST API.
 *
 * - Base URL comes from NEXT_PUBLIC_API_URL (see .env.local / .env.example).
 *   The single fallback below is only a local-dev convenience so the app can
 *   boot without env config; do NOT hard-code URLs in components — import
 *   from here or the resource modules in this folder instead.
 * - Works in both Server Components and Client Components (plain fetch).
 * - Never exposes raw server payloads: errors are normalized to ApiError
 *   with user-friendly messages.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

export type ApiErrorCode =
  | "NETWORK_ERROR"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "SERVER_ERROR"
  | "UNEXPECTED_ERROR";

export class ApiError extends Error {
  readonly status: number | null;
  readonly code: ApiErrorCode;
  /** Raw validation messages from Laravel 422 responses (for forms, not for display). */
  readonly validationErrors: Record<string, string[]> | null;

  constructor(
    message: string,
    opts: {
      status?: number | null;
      code?: ApiErrorCode;
      validationErrors?: Record<string, string[]> | null;
    } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = opts.status ?? null;
    this.code = opts.code ?? "UNEXPECTED_ERROR";
    this.validationErrors = opts.validationErrors ?? null;
  }
}

interface LaravelErrorBody {
  message?: string;
  errors?: Record<string, string[]>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toUserMessage(status: number, body: LaravelErrorBody | null): string {
  switch (status) {
    case 404:
      return "The requested record could not be found.";
    case 422:
      return "Some of the provided data was invalid. Please check and try again.";
    case 401:
      return "You need to sign in to access this resource.";
    case 403:
      return "You do not have permission to access this resource.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    default:
      if (status >= 500) {
        return "The server encountered an error. Please try again later.";
      }
      return body?.message ?? "Something went wrong. Please try again.";
  }
}

export type QueryValue = string | number | boolean | null | undefined;

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  query?: Record<string, QueryValue>;
  /** Override the revalidation window for Server Component fetches. */
  revalidate?: number;
}

/**
 * Typed fetch wrapper. Throws ApiError on HTTP or network failure.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { query, revalidate, ...init } = options;
  const url = buildUrl(path, query);

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { Accept: "application/json", ...init.headers },
      ...(typeof revalidate === "number" ? { next: { revalidate } } : {}),
    });
  } catch {
    // fetch only rejects on network-level failures (Laravel down, DNS, CORS block).
    throw new ApiError(
      "Could not reach the API server. Please make sure the Laravel backend is running and try again.",
      { status: null, code: "NETWORK_ERROR" },
    );
  }

  if (response.ok) {
    // 204 No Content has no body to parse.
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  let body: LaravelErrorBody | null = null;
  try {
    const parsed: unknown = await response.json();
    if (isRecord(parsed)) {
      body = {
        message: typeof parsed.message === "string" ? parsed.message : undefined,
        errors: isRecord(parsed.errors)
          ? (parsed.errors as Record<string, string[]>)
          : undefined,
      };
    }
  } catch {
    body = null; // Non-JSON error page — fall back to generic messaging.
  }

  const status = response.status;
  throw new ApiError(toUserMessage(status, body), {
    status,
    code:
      status === 404
        ? "NOT_FOUND"
        : status === 422
          ? "VALIDATION_ERROR"
          : status >= 500
            ? "SERVER_ERROR"
            : "UNEXPECTED_ERROR",
    validationErrors: status === 422 ? (body?.errors ?? null) : null,
  });
}

/**
 * Returns a safe message for rendering in the UI from any thrown value.
 * Guarantees raw server internals are never leaked to users.
 */
export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) {
    // fetch TypeErrors from other call sites still mean connectivity issues.
    if (error.name === "TypeError") {
      return "Could not reach the API server. Please make sure the Laravel backend is running and try again.";
    }
    return "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}
