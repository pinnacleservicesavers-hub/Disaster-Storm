import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  auth?: {
    role: string;
    user_id: string;
    scopes: string[];
  };
}

/**
 * JWT Claims extracted from Authorization header (no signature verification - dev only)
 */
interface JWTClaims {
  role?: string;
  app_role?: string;
  sub?: string;
  user_id?: string;
  [key: string]: any;
}

/**
 * Decode base64url string (JWT payload segment)
 */
function b64urlDecode(seg: string): string {
  try {
    const pad = '='.repeat((4 - (seg.length % 4)) % 4);
    const base64 = seg.replace(/-/g, '+').replace(/_/g, '/') + pad;
    return Buffer.from(base64, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

/**
 * Extract JWT claims from Authorization header
 * WARNING: This does NOT verify JWT signature - for development/demo only
 */
function claimsFromAuthz(authz: string): JWTClaims {
  if (!authz || !authz.toLowerCase().startsWith('bearer ')) {
    return {};
  }

  const token = authz.split(' ', 2)[1]?.trim();
  if (!token) return {};

  const parts = token.split('.');
  if (parts.length < 2) return {};

  try {
    const payload = b64urlDecode(parts[1]);
    if (!payload) return {};
    const claims = JSON.parse(payload);
    return typeof claims === 'object' ? claims : {};
  } catch {
    return {};
  }
}

/**
 * Middleware: Extract auth context from JWT or fallback headers
 * Sets req.auth for new auth system
 */
export function extractAuthContext(req: AuthRequest, res: Response, next: NextFunction) {
  // Try JWT claims first
  const authz = req.headers.authorization || '';
  const claims = claimsFromAuthz(authz);
  
  const roleFromJwt = (claims.role || claims.app_role || '').toLowerCase();
  const userFromJwt = claims.sub || claims.user_id || '';

  // Fallback to legacy headers
  const roleFromHeader = (req.headers['x-user-role'] as string || '').toLowerCase();
  const userFromHeader = (req.headers['x-user-id'] as string || '');
  const scopesFromHeader = (req.headers['x-scopes'] as string || '');

  // Final values (JWT takes precedence)
  const role = roleFromJwt || roleFromHeader || 'contractor';
  const user_id = userFromJwt || userFromHeader || 'demo-contractor';
  const scopes = scopesFromHeader
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  req.auth = { role, user_id, scopes };

  next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  // Check session for authenticated user
  const session = (req as any).session;
  
  if (!session || !session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  req.userId = session.userId;
  req.userRole = session.userRole;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}` });
    }
    next();
  };
}

export async function verifyOwnership(
  req: AuthRequest,
  resourceOwnerId: string,
  res: Response
): Promise<boolean> {
  if (req.userId !== resourceOwnerId && req.userRole !== 'admin') {
    res.status(403).json({ error: 'Access denied. You do not own this resource.' });
    return false;
  }
  return true;
}

/**
 * Middleware: Require admin role (new JWT-aware system)
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.auth?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * Middleware: Require contractor or admin role (new JWT-aware system)
 */
export function requireContractor(req: AuthRequest, res: Response, next: NextFunction) {
  const role = req.auth?.role;
  if (role !== 'contractor' && role !== 'admin') {
    return res.status(403).json({ error: 'Contractor access required' });
  }
  next();
}
