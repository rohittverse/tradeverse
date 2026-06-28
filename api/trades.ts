import type { IncomingMessage, ServerResponse } from 'http';
import { db } from '../src/db/index.js';
import { users, trades } from '../src/db/schema.js';
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
      const allTrades = await db
        .select()
        .from(trades)
        .where(eq(trades.userId, userId))
        .orderBy(desc(trades.tradeDate));
      return send(200, allTrades);
    } catch (error) {
      console.error('Error fetching trades:', error);
      return send(500, { error: 'Failed to fetch trades.' });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const newTrade = await db
        .insert(trades)
        .values({ ...body, userId })
        .returning();
      return send(200, newTrade[0]);
    } catch (error) {
      console.error('Error creating trade:', error);
      return send(500, { error: 'Failed to create trade.' });
    }
  }

  return send(405, { error: 'Method not allowed' });
}
