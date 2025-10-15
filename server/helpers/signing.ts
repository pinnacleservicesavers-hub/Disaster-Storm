import crypto from 'crypto';

const SECRET = process.env.TILE_SIGN_SECRET || 'dev-secret-change-in-production';
const DEFAULT_TTL_SEC = Number(process.env.TILE_SIGN_TTL_SEC || 300);

/**
 * Generate HMAC signature for URL with expiry
 */
export function signPath(pathWithQuery: string, ttlSec: number = DEFAULT_TTL_SEC): { sig: string; exp: number } {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const payload = `${pathWithQuery}|${exp}`;
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return { sig, exp };
}

/**
 * Add signature and expiry to URLSearchParams
 */
export function withSignedParams(path: string, params: URLSearchParams): string {
  const pathWithQuery = params.toString() ? `${path}?${params.toString()}` : path;
  const { sig, exp } = signPath(pathWithQuery);
  params.set('sig', sig);
  params.set('exp', String(exp));
  return `${path}?${params.toString()}`;
}

/**
 * Verify HMAC signature
 */
export function verifySignature(pathWithQuery: string, sig: string, exp: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  if (exp < now) return false;
  
  const payload = `${pathWithQuery}|${exp}`;
  const expectedSig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
}

/**
 * Express middleware to enforce signed URLs
 */
export function requireSignedUrl(req: any, res: any, next: any) {
  if (process.env.ENFORCE_SIGNED_TILES !== '1') {
    return next();
  }

  const { sig, exp, ...otherParams } = req.query;
  
  if (!sig || !exp) {
    return res.status(401).json({ error: 'Signature required (sig and exp params)' });
  }

  // Reconstruct path without sig/exp
  const params = new URLSearchParams(otherParams as Record<string, string>);
  const pathWithQuery = params.toString() ? `${req.path}?${params.toString()}` : req.path;

  if (!verifySignature(pathWithQuery, String(sig), Number(exp))) {
    return res.status(401).json({ error: 'Invalid or expired signature' });
  }

  next();
}
