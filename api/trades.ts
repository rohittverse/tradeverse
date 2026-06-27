import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../src/db/index.js';
import { users, trades } from '../src/db/schema.js';
import { requireAuth } from '../src/middleware/auth.js';
import { eq, desc } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;

  // Get internal user record
  const userRecord = await db.select().from(users).where(eq(users.uid, user.uid)).limit(1);
  if (userRecord.length === 0) return res.status(404).json({ error: 'User not found' });
  const userId = userRecord[0].id;

  if (req.method === 'GET') {
    try {
      const allTrades = await db
        .select()
        .from(trades)
        .where(eq(trades.userId, userId))
        .orderBy(desc(trades.tradeDate));
      return res.json(allTrades);
    } catch (error) {
      console.error('Error fetching trades:', error);
      return res.status(500).json({ error: 'Failed to fetch trades.' });
    }
  }

  if (req.method === 'POST') {
    try {
      const newTrade = await db
        .insert(trades)
        .values({ ...req.body, userId })
        .returning();
      return res.json(newTrade[0]);
    } catch (error) {
      console.error('Error creating trade:', error);
      return res.status(500).json({ error: 'Failed to create trade.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
