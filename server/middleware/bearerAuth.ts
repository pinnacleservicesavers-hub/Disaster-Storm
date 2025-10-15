import { Request, Response, NextFunction } from 'express';

export function requireBearer(req: Request, res: Response, next: NextFunction) {
  const token = process.env.API_AUTH_TOKEN;
  
  if (!token) {
    return res.status(500).json({ error: "Server missing API_AUTH_TOKEN" });
  }
  
  const hdr = req.headers.authorization || "";
  const got = hdr.startsWith("Bearer ") ? hdr.slice(7) : "";
  
  if (got && got === token) {
    return next();
  }
  
  return res.status(401).json({ error: "Unauthorized" });
}
