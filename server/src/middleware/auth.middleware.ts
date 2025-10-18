import { Request, Response, NextFunction } from 'express';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export interface AuthRequest extends Request {
  isAuthenticated?: boolean;
}

/**
 * Simple authentication middleware
 * Checks for password in Authorization header
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header provided' });
  }

  // Expected format: "Bearer <password>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Invalid authorization format. Expected: Bearer <password>' });
  }

  const password = parts[1];

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  req.isAuthenticated = true;
  next();
}

/**
 * Verify password without requiring it in every request
 */
export function verifyPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

