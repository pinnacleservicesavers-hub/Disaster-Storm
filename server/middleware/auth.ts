import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
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
