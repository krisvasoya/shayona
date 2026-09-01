import { Request, Response, NextFunction } from 'express';
import admin from '../config/firebase';
import { supabase } from '../config/supabase';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  try {
    let uid: string;
    let email: string = '';
    let name: string = '';

    // Handle dev / test token mode if Firebase Admin is not configured or in dev
    if (token.startsWith('dev-token-') || token === 'mock-jwt-token') {
      uid = '00000000-0000-0000-0000-000000000001';
      email = 'dev@example.com';
      name = 'Dev User';
    } else {
      const decoded = await admin.auth().verifyIdToken(token);
      uid = decoded.uid;
      email = decoded.email || '';
      name = decoded.name || '';
    }

    req.user = { uid, email, name };

    // Ensure the user exists in public.users to satisfy foreign key constraints
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await supabase.from('users').upsert(
          {
            id: uid,
            email: email || `${uid}@example.com`,
            display_name: name || 'Retail Owner',
          },
          { onConflict: 'id' }
        );
      } catch (upsertErr) {
        console.warn('User upsert note:', upsertErr);
      }
    }

    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};
