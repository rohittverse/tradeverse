import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../src/db/index.js';
import { users, goals } from '../src/db/schema.js';
import { requireAuth } from '../src/middleware/auth.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const userRecord = await db.select().from(users).where(eq(users.uid, user.uid)).limit(1);
  if (userRecord.length === 0) return res.status(404).json({ error: 'User not found' });
  const userId = userRecord[0].id;

  if (req.method === 'GET') {
    try {
      const userGoals = await db.select().from(goals).where(eq(goals.userId, userId));
      return res.json(userGoals);
    } catch (error) {
      console.error('Error fetching goals:', error);
      return res.status(500).json({ error: 'Failed to fetch goals.' });
    }
  }

  if (req.method === 'POST') {
    try {
      const newGoal = await db
        .insert(goals)
        .values({ ...req.body, userId })
        .returning();
      return res.json(newGoal[0]);
    } catch (error) {
      console.error('Error creating goal:', error);
      return res.status(500).json({ error: 'Failed to create goal.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
