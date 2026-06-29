'use strict';

module.exports = async function handler(req, res) {
  const send = (code, data) => {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  try {
    // Step 1: Check env vars
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      return send(500, { error: 'Missing FIREBASE_SERVICE_ACCOUNT_KEY' });
    }
    if (!process.env.DATABASE_URL) {
      return send(500, { error: 'Missing DATABASE_URL' });
    }

    // Step 2: Parse service account
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch (e) {
      return send(500, { error: 'Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON: ' + e.message });
    }

    // Step 3: Init Firebase Admin
    const { getApps, initializeApp, cert } = require('firebase-admin/app');
    const { getAuth } = require('firebase-admin/auth');
    if (!getApps().length) {
      initializeApp({ credential: cert(serviceAccount) });
    }

    // Step 4: Verify token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return send(401, { error: 'Missing token' });
    }
    const token = authHeader.split('Bearer ')[1];
    const decoded = await getAuth().verifyIdToken(token);

    // Step 5: DB operation
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    if (req.method === 'POST') {
      await pool.query(
        `INSERT INTO users (uid, email) VALUES ($1, $2)
         ON CONFLICT (uid) DO UPDATE SET email = $2`,
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
    console.error('USERS ERROR:', error);
    return send(500, { error: error.message, stack: error.stack });
  }
};
