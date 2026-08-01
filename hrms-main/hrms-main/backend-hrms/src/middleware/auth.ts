import { Request, Response, NextFunction } from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jwt: any = require('jsonwebtoken');
import pool from '../db';

export interface AuthUser {
  id: number;
  username: string;
  role: 'employee' | 'hr' | 'admin';
  departmentId?: number | null;
  employeeId?: number | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: missing token' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser;
    
    // Verify user still exists in DB
    const [rows]: any = await pool.query('SELECT id FROM hrms_users WHERE id = ?', [payload.id]);
    if (!rows || rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Unauthorized: user no longer exists' });
    }

    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized: invalid token' });
  }
}

export function authorizeRoles(...allowedRoles: Array<AuthUser['role']>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
    }
    next();
  };
}


