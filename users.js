export default async function handler(req, res) {
  const send = (code, data) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(code).json(data);
  };

  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) return send(500, { error: 'Missing FIREBASE_SERVICE_ACCOUNT_KEY' });
    if (!process.env.DATABASE_URL) return send(500, { error: 'Missing DATABASE_URL' });

    // Dynamic imports for ESM-only modules
    const { getApps, initializeApp, cert } = await import('firebase-admin/app');
    const { getAuth } = await import('firebase-admin/auth');

    if (!getApps().length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({ credential: cert(serviceAccount) });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return send(401, { error: 'Missing token' });
    const token = authHeader.split('Bearer ')[1];
    const decoded = await getAuth().verifyIdToken(token);

    const { default: pg } = await import('pg');
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

    if (req.method === 'POST') {
      await pool.query(
        `INSERT INTO users (uid, email) VALUES ($1, $2) ON CONFLICT (uid) DO UPDATE SET email = $2`,
        [decoded.uid, decoded.email]
      );
      const result = await pool.query('SELECT * FROM users WHERE uid = $1', [decoded.uid]);
      await pool.end();
      return send(200, result.rows[0]);
    }

    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM users WHERE uid = $1', [decoded.uid]);
      await pool.end();
      if (result.rows.length === 0) return send(404, { error: 'User not found' });
      return send(200, result.rows[0]);
    }

    await pool.end();
    return send(405, { error: 'Method not allowed' });

  } catch (error) {
    console.error('USERS ERROR:', error.message);
    return send(500, { error: error.message });
  }
}
