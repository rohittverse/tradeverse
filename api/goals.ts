import type { IncomingMessage, ServerResponse } from 'http';
import { db } from '../src/db/index.js';
import { users, goals } from '../src/db/schema.js';
import { requireAuth } from '../src/middleware/auth.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: IncomingMessage & { body?: any }, res: ServerResponse) {
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
      const userGoals = await db.select().from(goals).where(eq(goals.userId, userId));
      return send(200, userGoals);
    } catch (error) {
      console.error('Error fetching goals:', error);
      return send(500, { error: 'Failed to fetch goals.' });
    }
  }

  if (req.method === 'POST') {
    try {
      const newGoal = await db.insert(goals).values({ ...req.body, userId }).returning();
      return send(200, newGoal[0]);
    } catch (error) {
      console.error('Error creating goal:', error);
      return send(500, { error: 'Failed to create goal.' });
    }
  }

  return send(405, { error: 'Method not allowed' });
}
