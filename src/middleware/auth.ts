import { adminAuth } from '../lib/firebase-admin.js';
import { DecodedIdToken } from 'firebase-admin/auth';

export async function requireAuth(
  req: { headers: { authorization?: string } },
  send: (code: number, data: any) => void
): Promise<DecodedIdToken | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    send(401, { error: 'Unauthorized: Missing token' });
    return null;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    return await adminAuth.verifyIdToken(token);
  } catch (error) {
    send(401, { error: 'Unauthorized: Invalid token' });
    return null;
  }
}
