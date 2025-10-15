import { Request, Response, NextFunction } from 'express';

function extractBearer(req: Request): string {
  const hdr = req.headers.authorization || "";
  return hdr.startsWith("Bearer ") ? hdr.slice(7) : "";
}

/**
 * Role-based authentication for Disaster Direct
 * 
 * Roles:
 * - ADMIN: Full write access, alerts, warm, imports, enqueue
 * - SIGNER: Allowed to mint signatures (/api/sign/*)
 * - VIEWER: Optional read-only for JSON GETs (impact/nws/xweather)
 * 
 * Back-compat: BEARER_TOKEN acts as ADMIN if set
 */
export function requireRole(role: "ADMIN" | "SIGNER" | "VIEWER" = "ADMIN") {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = extractBearer(req);

    // Legacy single token behaves as ADMIN
    const ADMIN = process.env.ADMIN_API_TOKEN || process.env.BEARER_TOKEN || "";
    const SIGNER = process.env.SIGNER_API_TOKEN || "";
    const VIEWER = process.env.VIEWER_API_TOKEN || process.env.READONLY_TOKEN || "";

    const ok =
      (role === "ADMIN"  && token && token === ADMIN) ||
      (role === "SIGNER" && token && (token === ADMIN || token === SIGNER)) ||
      (role === "VIEWER" && token && (token === ADMIN || token === VIEWER));

    if (ok) return next();

    const msg =
      role === "ADMIN"  ? "Admin token required" :
      role === "SIGNER" ? "Signer or admin token required" :
                          "Viewer token required";

    return res.status(401).json({ error: "Unauthorized", required: role, message: msg });
  };
}

/** Legacy compatibility - use requireRole("ADMIN") instead */
export function requireBearer(req: Request, res: Response, next: NextFunction) {
  return requireRole("ADMIN")(req, res, next);
}

/** Optional: gate read-only JSON GETs if VIEWER/READONLY token is set */
export function requireViewerIfEnabled(req: Request, res: Response, next: NextFunction) {
  const VIEWER = process.env.VIEWER_API_TOKEN || process.env.READONLY_TOKEN || "";
  if (!VIEWER) return next(); // gating disabled
  return requireRole("VIEWER")(req, res, next);
}
