import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../src/db/index.js';
import { users, journalEntries } from '../src/db/schema.js';
import { requireAuth } from '../src/middleware/auth.js';
import { eq, desc } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const userRecord = await db.select().from(users).where(eq(users.uid, user.uid)).limit(1);
  if (userRecord.length === 0) return res.status(404).json({ error: 'User not found' });
  const userId = userRecord[0].id;

  if (req.method === 'GET') {
    try {
      const entries = await db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.userId, userId))
        .orderBy(desc(journalEntries.createdAt));
      return res.json(entries);
    } catch (error) {
      console.error('Error fetching journal:', error);
      return res.status(500).json({ error: 'Failed to fetch journal entries.' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { notes, mood } = req.body;
      const today = new Date().toISOString().split('T')[0];
      // Fix: map frontend fields (notes, mood) to correct schema columns
      const newEntry = await db
        .insert(journalEntries)
        .values({
          userId,
          tradeDate: today,
          postTradeReview: notes,   // "notes" stored in postTradeReview
          emotions: mood,           // "mood" stored in emotions
        })
        .returning();
      return res.json(newEntry[0]);
    } catch (error) {
      console.error('Error creating journal entry:', error);
      return res.status(500).json({ error: 'Failed to create journal entry.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
