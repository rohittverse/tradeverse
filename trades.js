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
      const result = await pool.query('SELECT * FROM trades WHERE user_id = $1 ORDER BY trade_date DESC', [userId]);
      await pool.end();
      return send(200, result.rows);
    }

    if (req.method === 'POST') {
      const body = req.body;
      const result = await pool.query(
        `INSERT INTO trades (user_id, trade_date, asset, trade_type, entry_price, exit_price, lot_size, contract_size, quantity, leverage, position_value, used_margin, profit_loss, roi_percentage, notes, strategy, mistakes, emotions)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
        [userId, body.tradeDate, body.asset, body.tradeType, body.entryPrice, body.exitPrice || null,
         body.lotSize, body.contractSize, body.quantity, body.leverage, body.positionValue,
         body.usedMargin, body.profitLoss || null, body.roiPercentage || null,
         body.notes || null, body.strategy || null, body.mistakes || null, body.emotions || null]
      );
      await pool.end();
      return send(200, result.rows[0]);
    }

    await pool.end();
    return send(405, { error: 'Method not allowed' });
  } catch (error) {
    console.error('TRADES ERROR:', error.message);
    return send(500, { error: error.message });
  }
}
