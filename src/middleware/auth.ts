import { VercelRequest, VercelResponse } from '@vercel/node';
import { adminAuth } from '../lib/firebase-admin.js';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends VercelRequest {
  user?: DecodedIdToken;
}

export async function requireAuth(
  req: AuthRequest,
  res: VercelResponse
): Promise<DecodedIdToken | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing token' });
    return null;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    return await adminAuth.verifyIdToken(token);
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return null;
  }
}
