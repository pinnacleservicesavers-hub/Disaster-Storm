type LegendOpts = { scheme?: string; width?: number; height?: number; bg?: "solid"|"transparent"; fmt?: "png"|"svg" };

/** Unsigned tile template (CDN-friendly). */
export function makeUnsignedTileTemplate(base = "/api/impact/tiles/{z}/{x}/{y}.png", qp: Record<string,string|number> = {}) {
  const qs = new URLSearchParams(qp as Record<string,string>).toString();
  return qs ? `${base}?${qs}` : base;
}

/** Very small memo for signed URLs */
function memo<T>(max = 200) {
  const m = new Map<string, { v:T; exp?: number }>();
  return {
    async getOrSet(key: string, exp: number|undefined, make: () => Promise<T>): Promise<T> {
      const hit = m.get(key); const now = Math.floor(Date.now()/1000);
      if (hit && (!hit.exp || hit.exp - 10 > now)) return hit.v;
      const v = await make(); if (m.size > max) m.delete(m.keys().next().value);
      m.set(key, { v, exp }); return v;
    }
  };
}

/** Mapbox GL: transformRequest that auto-signs /api/impact/tiles with your backend signer. */
export function makeMapboxTransformRequest(baseUrl = "", signEndpoint = "/api/sign/tile") {
  const cache = memo<string>(500);
  return async function transformRequest(url: string, resourceType: string) {
    if (resourceType !== "Tile" && resourceType !== "Image") return { url };
    if (!url.includes("/api/impact/tiles/")) return { url };

    try {
      const u = new URL(url, typeof window !== "undefined" ? window.location.origin : baseUrl || "http://localhost");
      const m = u.pathname.match(/\/api\/impact\/tiles\/(\d+)\/(\d+)\/(\d+)\.(png|svg)/);
      if (!m) return { url };
      const [ , z, x, y, fmt ] = m;
      const p = u.searchParams;
      const pollen = p.get("pollen") ?? "1"; const grid = p.get("grid") ?? "3";
      const scheme = p.get("scheme") ?? "viridis"; const ttl = p.get("ttl") ?? "180";
      const key = `${z}/${x}/${y}.${fmt}?p=${pollen}&g=${grid}&s=${scheme}&t=${ttl}`;

      const signed = await cache.getOrSet(key, undefined, async () => {
        const sig = new URL(signEndpoint, baseUrl || u.origin);
        sig.searchParams.set("z", z); sig.searchParams.set("x", x); sig.searchParams.set("y", y);
        sig.searchParams.set("fmt", fmt); sig.searchParams.set("pollen", pollen);
        sig.searchParams.set("grid", grid); sig.searchParams.set("scheme", scheme); sig.searchParams.set("ttl", ttl);
        const r = await fetch(sig.toString(), { credentials: "include" });
        if (!r.ok) throw new Error(`sign ${r.status}`);
        const j = await r.json(); return j.url as string;
      });

      return { url: signed };
    } catch { return { url }; }
  };
}

/** Legend URL helper (works unsigned, or via /api/sign/legend when HMAC enabled). */
export async function getLegendUrl(baseUrl = "", opts: LegendOpts = {}, hmac = false): Promise<string> {
  const { scheme = "traffic", width = 256, height = 48, bg = "solid", fmt = "png" } = opts;
  if (!hmac) {
    const u = new URL(`/api/legend.${fmt}`, baseUrl || (typeof window !== "undefined" ? window.location.origin : "http://localhost"));
    u.searchParams.set("scheme", scheme); u.searchParams.set("width", String(width));
    u.searchParams.set("height", String(height)); u.searchParams.set("bg", bg);
    return u.pathname + "?" + u.searchParams.toString();
  }
  const sign = new URL("/api/sign/legend", baseUrl || (typeof window !== "undefined" ? window.location.origin : "http://localhost"));
  sign.searchParams.set("scheme", scheme);
  sign.searchParams.set("width", String(width));
  sign.searchParams.set("height", String(height));
  sign.searchParams.set("bg", bg);
  const r = await fetch(sign.toString(), { credentials: "include" });
  if (!r.ok) throw new Error("legend sign failed");
  const { url } = await r.json();
  return url;
}
