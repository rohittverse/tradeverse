import type { IncomingMessage, ServerResponse } from 'http';
import { db } from '../src/db/index.js';
import { users } from '../src/db/schema.js';
import { requireAuth } from '../src/middleware/auth.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: IncomingMessage & { body?: any }, res: ServerResponse & { json?: any, status?: any }) {
  const send = (code: number, data: any) => {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  const user = await requireAuth(req as any, send);
  if (!user) return;

  if (req.method === 'POST') {
    try {
      const result = await db
        .insert(users)
        .values({ uid: user.uid, email: user.email! })
        .onConflictDoUpdate({ target: users.uid, set: { email: user.email! } })
        .returning();
      return send(200, result[0]);
    } catch (error) {
      console.error('Error creating/updating user:', error);
      return send(500, { error: 'Failed to create or update user.' });
    }
  }

  if (req.method === 'GET') {
    try {
      const result = await db.select().from(users).where(eq(users.uid, user.uid)).limit(1);
      if (result.length === 0) return send(404, { error: 'User not found' });
      return send(200, result[0]);
    } catch (error) {
      console.error('Error fetching user:', error);
      return send(500, { error: 'Failed to fetch user.' });
    }
  }

  return send(405, { error: 'Method not allowed' });
}
