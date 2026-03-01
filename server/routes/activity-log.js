const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const paginate = (total, data, page, limit) => ({
  data,
  pagination: { page, limit, total, pages: Math.ceil(total / limit) }
});

// GET activity logs (protected, paginated)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM activity_log');
    const [rows] = await pool.execute(
      'SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    res.json(paginate(total, rows, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

module.exports = router;
