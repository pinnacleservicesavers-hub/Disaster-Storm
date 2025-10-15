// Cloudflare Worker – edge signer for Disaster Direct
// Routes:
//   GET /sign/tile?z=10&x=271&y=392&fmt=png&pollen=1&grid=6&scheme=viridis&ttl=180
//   GET /sign/legend?scheme=viridis&width=256&height=48&bg=solid&fmt=png&ttl=180
//
// Env Vars (wrangler):
//   TILE_SIGN_SECRET   -> same value as backend
//   TILE_SIGN_TTL_SEC  -> default TTL (e.g., 300)
//   PUBLIC_BASE_PATH   -> usually "" (paths are relative to your backend origin if you proxy)

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/health") {
      return new Response(JSON.stringify({ status: "OK" }), { headers: { "Content-Type": "application/json" } });
    }

    const secret = env.TILE_SIGN_SECRET || "dev-secret";
    const defaultTtl = Number(env.TILE_SIGN_TTL_SEC || 300);

    const sign = async (pathWithQuery, ttlSec = defaultTtl) => {
      const exp = Math.floor(Date.now() / 1000) + ttlSec;
      const payload = `${pathWithQuery}|${exp}`;
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
      const sigHex = [...new Uint8Array(sigBuf)].map(b => b.toString(16).padStart(2, "0")).join("");
      return { sig: sigHex, exp };
    };

    const qpOut = (obj) => {
      const sp = new URLSearchParams();
      Object.entries(obj).forEach(([k,v]) => sp.set(k, String(v)));
      return sp.toString();
    };

    if (path === "/sign/tile") {
      const z = url.searchParams.get("z");
      const x = url.searchParams.get("x");
      const y = url.searchParams.get("y");
      if (!z || !x || !y) return new Response(JSON.stringify({ error: "z,x,y required" }), { status: 400 });

      const fmt = url.searchParams.get("fmt") || "png";
      const pollen = url.searchParams.get("pollen") ?? "1";
      const grid = url.searchParams.get("grid") || "6";
      const scheme = url.searchParams.get("scheme") || "viridis";
      const ttl = Number(url.searchParams.get("ttl") || defaultTtl);

      const urlPath = `/api/impact/tiles/${z}/${x}/${y}.${fmt}`;
      const query = qpOut({ pollen, grid, scheme, ttl });
      const pathWithQuery = query ? `${urlPath}?${query}` : urlPath;
      const { sig, exp } = await sign(pathWithQuery, ttl);

      const signed = new URLSearchParams(query);
      signed.set("sig", sig); signed.set("exp", String(exp));
      return new Response(JSON.stringify({ url: `${urlPath}?${signed.toString()}` }), { headers: { "Content-Type": "application/json" } });
    }

    if (path === "/sign/legend") {
      const scheme = url.searchParams.get("scheme") || "viridis";
      const width = url.searchParams.get("width") || "256";
      const height = url.searchParams.get("height") || "48";
      const bg = url.searchParams.get("bg") || "solid";
      const fmt = url.searchParams.get("fmt") || "png";
      const ttl = Number(url.searchParams.get("ttl") || defaultTtl);

      const urlPath = `/api/legend.${fmt}`;
      const query = qpOut({ scheme, width, height, bg, ttl });
      const pathWithQuery = query ? `${urlPath}?${query}` : urlPath;
      const { sig, exp } = await sign(pathWithQuery, ttl);

      const signed = new URLSearchParams(query);
      signed.set("sig", sig); signed.set("exp", String(exp));
      return new Response(JSON.stringify({ url: `${urlPath}?${signed.toString()}` }), { headers: { "Content-Type": "application/json" } });
    }

    return new Response("Not Found", { status: 404 });
  }
}
