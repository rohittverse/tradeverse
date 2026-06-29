export default async function handler(req, res) {
  const send = (code, data) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(code).json(data);
  };

  try {
    const { getApps, initializeApp, cert } = await import('firebase-admin/app');
    const { getAuth } = await import('firebase-admin/auth');
    if (!getApps().length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({ credential: cert(serviceAccount) });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return send(401, { error: 'Missing token' });
    const decoded = await getAuth().verifyIdToken(authHeader.split('Bearer ')[1]);

    const { default: pg } = await import('pg');
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

    const userResult = await pool.query('SELECT * FROM users WHERE uid = $1', [decoded.uid]);
    if (userResult.rows.length === 0) { await pool.end(); return send(404, { error: 'User not found' }); }
    const userId = userResult.rows[0].id;

    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM journal_entries WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      await pool.end();
      return send(200, result.rows);
    }

    if (req.method === 'POST') {
      const body = req.body;
      const today = new Date().toISOString().split('T')[0];
      const result = await pool.query(
        `INSERT INTO journal_entries (user_id, trade_date, post_trade_review, emotions) VALUES ($1,$2,$3,$4) RETURNING *`,
        [userId, today, body.notes || null, body.mood || null]
      );
      await pool.end();
      return send(200, result.rows[0]);
    }

    await pool.end();
    return send(405, { error: 'Method not allowed' });
  } catch (error) {
    console.error('JOURNAL ERROR:', error.message);
    return send(500, { error: error.message });
  }
}
