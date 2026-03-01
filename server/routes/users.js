const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { sanitizeBody, validateEmail } = require('../middleware/sanitize');
const logActivity = require('../middleware/logger');

const SALT_ROUNDS = 10;

const paginate = (total, data, page, limit) => ({
  data,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  }
});

// GET all users (protected, paginated)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM users');
    const [rows] = await pool.execute(
      'SELECT id, email, name, role, phone, created_at AS createdAt FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    res.json(paginate(total, rows, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET agents only (protected, paginated)
router.get('/agents', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [[{ total }]] = await pool.execute(
      "SELECT COUNT(*) AS total FROM users WHERE role = 'agent'"
    );
    const [rows] = await pool.execute(
      "SELECT id, email, name, role, phone, created_at AS createdAt FROM users WHERE role = 'agent' ORDER BY name ASC LIMIT ? OFFSET ?",
      [limit, offset]
    );

    res.json(paginate(total, rows, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// POST create agent (admin only)
router.post('/', authenticateToken, requireRole(['admin']), sanitizeBody, async (req, res) => {
  try {
    if (!validateEmail(req.body.email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [req.body.email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, SALT_ROUNDS);
    const id = uuidv4();

    await pool.execute(
      'INSERT INTO users (id, email, password, name, role, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [id, req.body.email, hashedPassword, req.body.name || '', 'agent', req.body.phone || '']
    );

    await logActivity('CREATE_AGENT', `Created new agent: ${req.body.name}`, req.user.name);

    const [rows] = await pool.execute(
      'SELECT id, email, name, role, phone, created_at AS createdAt FROM users WHERE id = ?',
      [id]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Failed to create agent:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// DELETE user (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT name FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    await logActivity('DELETE_USER', `Deleted user: ${rows[0].name}`, req.user.name);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
