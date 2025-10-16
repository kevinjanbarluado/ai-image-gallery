import { Request, Response, NextFunction } from 'express';
import { verifyAuth } from '../lib/supabase.js';

export interface AuthRequest extends Request {
  userId?: string;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = await verifyAuth(req.headers.authorization);
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    req.userId = userId;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

