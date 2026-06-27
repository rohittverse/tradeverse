import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../src/db/index.js';
import { users } from '../src/db/schema.js';
import { requireAuth } from '../src/middleware/auth.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === 'POST') {
    try {
      const result = await db
        .insert(users)
        .values({ uid: user.uid, email: user.email! })
        .onConflictDoUpdate({
          target: users.uid,
          set: { email: user.email! },
        })
        .returning();
      return res.json(result[0]);
    } catch (error) {
      console.error('Error creating/updating user:', error);
      return res.status(500).json({ error: 'Failed to create or update user.' });
    }
  }

  if (req.method === 'GET') {
    try {
      const result = await db.select().from(users).where(eq(users.uid, user.uid)).limit(1);
      if (result.length === 0) return res.status(404).json({ error: 'User not found' });
      return res.json(result[0]);
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ error: 'Failed to fetch user.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
