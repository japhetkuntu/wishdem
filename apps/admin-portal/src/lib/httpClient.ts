/**
 * Thin fetch wrapper around WishDem.Admin.Api. Every real network call in
 * lib/api.ts goes through `apiRequest` so token storage, the ApiResponse<T>
 * envelope, and 401-refresh-and-retry are handled in exactly one place.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5102";

const ACCESS_TOKEN_KEY = "wishdem-admin-access-token";
const REFRESH_TOKEN_KEY = "wishdem-admin-refresh-token";

export class ApiError extends Error {
  constructor(
    public readonly code: number,
    message: string,
    public readonly errors?: { field: string; errorMessage: string }[] | null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiEnvelope<T> {
  message: string;
  code: number;
  data: T | null;
  subCode: string;
  errors: { field: string; errorMessage: string }[] | null;
}

export function getAccessToken(): string | null {
  try {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

function getRefreshToken(): string | null {
  try {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setTokens(accessToken: string, refreshToken: string) {
  try {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch {
    // Storage unavailable — session just won't survive a reload.
  }
}

export function clearTokens() {
  try {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Nothing to clean up if storage isn't available.
  }
}

export function hasSession(): boolean {
  return !!getAccessToken();
}

async function rawRequest<T>(path: string, init: RequestInit, skipAuth: boolean): Promise<ApiEnvelope<T>> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    // No JSON body (e.g. a network-level failure) — synthesize an envelope
    // from the HTTP status so callers still get a consistent shape.
  }

  return (
    body ?? {
      message: res.ok ? "Success" : `Request failed with status ${res.status}.`,
      code: res.status,
      data: null,
      subCode: "0",
      errors: null,
    }
  );
}

let refreshInFlight: Promise<boolean> | null = null;

/** Refreshes the access token at most once concurrently — a burst of 401s
 * from several in-flight requests all await the same refresh call. */
async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  refreshInFlight ??= rawRequest<{ accessToken: string; refreshToken: string }>(
    "/api/auth/refresh",
    { method: "POST", body: JSON.stringify({ refreshToken }) },
    true,
  )
    .then((body) => {
      if (body.code === 200 && body.data) {
        setTokens(body.data.accessToken, body.data.refreshToken);
        return true;
      }
      clearTokens();
      return false;
    })
    .catch(() => {
      clearTokens();
      return false;
    })
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

export interface ApiRequestOptions extends RequestInit {
  /** Skip attaching the Authorization header and skip refresh-on-401 — for auth endpoints themselves. */
  skipAuth?: boolean;
}

/** Unwraps the backend's ApiResponse&lt;T&gt; envelope, retrying once via a
 * refreshed token on 401, and throws ApiError for any other non-2xx code. */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { skipAuth = false, ...init } = options;

  let body = await rawRequest<T>(path, init, skipAuth);

  if (body.code === 401 && !skipAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) body = await rawRequest<T>(path, init, skipAuth);
  }

  if (body.code >= 400) throw new ApiError(body.code, body.message, body.errors);
  return body.data as T;
}
