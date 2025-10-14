export type DDSuccess<T = unknown> = { ok: true; data: T; status: number };
export type DDError = {
  ok: false; status: number; code?: number;
  error: string; details?: string; requestId?: string; retryAfterSec?: number; hint?: string;
  userMessage: string; retryable: boolean;
};
export type DDResult<T = unknown> = DDSuccess<T> | DDError;

export interface FetchOpts extends RequestInit {
  retries?: number; backoffBaseMs?: number; backoffCapMs?: number;
}

export function getRetryAfterSec(res: Response): number | undefined {
  const h = res.headers.get("Retry-After"); if (!h) return;
  const sec = Number(h); return Number.isFinite(sec) ? sec : undefined;
}
export function isRetryableStatus(status: number): boolean { return status === 429 || status >= 500; }

export function errorToUserMessage(e: { status: number; error?: string; hint?: string; }): string {
  const { status, error, hint } = e;
  if (status === 401) return "Sign in to continue. Your session may have expired.";
  if (status === 403) return "You don’t have permission to view this data.";
  if (status === 429) return "Too many requests right now. Please wait and try again.";
  if (status >= 500) return "Service is temporarily unavailable.";
  return hint || error || "Request failed. Please try again.";
}
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function apiFetch<T = unknown>(url: string, opts: FetchOpts = {}): Promise<DDResult<T>> {
  const { retries = 0, backoffBaseMs = 250, backoffCapMs = 3000, headers, ...rest } = opts;
  let attempt = 0;
  const hdrs = new Headers(headers); if (!hdrs.has("Accept")) hdrs.set("Accept", "application/json");

  const once = async (): Promise<DDResult<T>> => {
    let res: Response;
    try { res = await fetch(url, { ...rest, headers: hdrs }); }
    catch (e: any) { return { ok: false, status: 0, error: "NetworkError", details: String(e), userMessage: "Network error. Check your connection.", retryable: true }; }

    const ct = res.headers.get("Content-Type") || ""; const ra = getRetryAfterSec(res);
    if (res.ok) {
      if (ct.includes("application/json")) return { ok: true, data: await res.json() as T, status: res.status };
      if (ct.startsWith("image/")) return { ok: true, data: await res.blob() as any as T, status: res.status };
      return { ok: true, data: await res.text() as any as T, status: res.status };
    }
    let parsed: any; if (ct.includes("application/json")) { try { parsed = await res.json(); } catch {} }
    const status = res.status; const error = parsed?.error || res.statusText || "Error";
    const details = parsed?.details; const requestId = parsed?.requestId; const hint = parsed?.hint;
    const userMessage = errorToUserMessage({ status, error, hint }); const retryable = isRetryableStatus(status);
    return { ok: false, status, code: parsed?.code ?? status, error, details, requestId, hint, userMessage, retryable, retryAfterSec: ra };
  };

  let result = await once();
  while (!result.ok && result.retryable && attempt < retries) {
    attempt++;
    const jitter = Math.random() * backoffBaseMs;
    const backoffMs = Math.min(backoffBaseMs * Math.pow(2, attempt - 1) + jitter, backoffCapMs);
    const waitSec = (result as DDError).retryAfterSec ?? backoffMs / 1000;
    await sleep(waitSec * 1000);
    result = await once();
  }
  return result;
}

export async function getImpact(baseUrl: string, lat: number, lng: number, pollen = false, init?: FetchOpts) {
  const u = new URL("/api/impact", baseUrl);
  u.searchParams.set("lat", String(lat));
  u.searchParams.set("lng", String(lng));
  if (pollen) u.searchParams.set("pollen", "1");
  return apiFetch<{
    impactScore: number;
    components: Record<string, unknown>;
    meta?: Record<string, unknown>;
  }>(u.toString(), { retries: 2, ...init });
}
