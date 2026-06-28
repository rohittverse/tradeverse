import type { IncomingMessage, ServerResponse } from 'http';
import { db } from '../src/db/index.js';
import { users, journalEntries } from '../src/db/schema.js';
import { requireAuth } from '../src/middleware/auth.js';
import { parseBody } from './_helpers.js';
import { eq, desc } from 'drizzle-orm';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const send = (code: number, data: any) => {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  const user = await requireAuth(req as any, send);
  if (!user) return;

  const userRecord = await db.select().from(users).where(eq(users.uid, user.uid)).limit(1);
  if (userRecord.length === 0) return send(404, { error: 'User not found' });
  const userId = userRecord[0].id;

  if (req.method === 'GET') {
    try {
      const entries = await db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.userId, userId))
        .orderBy(desc(journalEntries.createdAt));
      return send(200, entries);
    } catch (error) {
      console.error('Error fetching journal:', error);
      return send(500, { error: 'Failed to fetch journal entries.' });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { notes, mood } = body;
      const today = new Date().toISOString().split('T')[0];
      const newEntry = await db
        .insert(journalEntries)
        .values({
          userId,
          tradeDate: today,
          postTradeReview: notes,
          emotions: mood,
        })
        .returning();
      return send(200, newEntry[0]);
    } catch (error) {
      console.error('Error creating journal entry:', error);
      return send(500, { error: 'Failed to create journal entry.' });
    }
  }

  return send(405, { error: 'Method not allowed' });
}
