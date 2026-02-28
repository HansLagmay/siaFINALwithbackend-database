const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { sanitizeBody } = require('../middleware/sanitize');
const logActivity = require('../middleware/logger');

const CONFLICT_BUFFER_MS = 30 * 60 * 1000; // 30 minutes

const paginate = (total, data, page, limit) => ({
  data,
  pagination: { page, limit, total, pages: Math.ceil(total / limit) }
});

// GET all calendar events (protected, paginated)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const shared = req.query.shared === 'true';

    let countSql = 'SELECT COUNT(*) AS total FROM calendar_events';
    let dataSql = 'SELECT * FROM calendar_events ORDER BY start_time ASC LIMIT ? OFFSET ?';
    const countParams = [];
    const dataParams = [limit, offset];

    if (req.user.role === 'agent' && !shared) {
      countSql += ' WHERE agent_id = ?';
      dataSql = 'SELECT * FROM calendar_events WHERE agent_id = ? ORDER BY start_time ASC LIMIT ? OFFSET ?';
      countParams.push(req.user.id);
      dataParams.unshift(req.user.id);
    }

    const [[{ total }]] = await pool.execute(countSql, countParams);
    const [rows] = await pool.execute(dataSql, dataParams);

    res.json(paginate(total, rows, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// GET events for specific agent (protected)
router.get('/agent/:agentId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'agent' && req.params.agentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM calendar_events WHERE agent_id = ? ORDER BY start_time ASC',
      [req.params.agentId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent events' });
  }
});

// POST new event (protected)
router.post('/', authenticateToken, sanitizeBody, async (req, res) => {
  try {
    const { start, end, agentId, title } = req.body;

    if (req.user.role === 'agent' && agentId !== req.user.id) {
      return res.status(403).json({ error: 'Cannot create events for other agents' });
    }

    // Conflict check with 30-minute buffer
    const newStart = new Date(start).getTime();
    const newEnd = new Date(end).getTime();
    const bufferStart = new Date(newStart - CONFLICT_BUFFER_MS).toISOString().slice(0, 19).replace('T', ' ');
    const bufferEnd = new Date(newEnd + CONFLICT_BUFFER_MS).toISOString().slice(0, 19).replace('T', ' ');

    const [conflicts] = await pool.execute(
      'SELECT id FROM calendar_events WHERE agent_id = ? AND start_time < ? AND end_time > ?',
      [agentId, bufferEnd, bufferStart]
    );

    if (conflicts.length > 0) {
      return res.status(409).json({
        error: 'Schedule conflict: You have another event within 30 minutes of this time'
      });
    }

    const id = uuidv4();
    const startDb = new Date(start).toISOString().slice(0, 19).replace('T', ' ');
    const endDb = new Date(end).toISOString().slice(0, 19).replace('T', ' ');

    await pool.execute(
      'INSERT INTO calendar_events (id, title, start_time, end_time, agent_id, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [id, title || '', startDb, endDb, agentId || req.user.id, req.user.name]
    );

    await logActivity('CREATE_EVENT', `Created calendar event: ${title}`, req.user.name);

    const [rows] = await pool.execute('SELECT * FROM calendar_events WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Failed to create event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// PUT update event (protected)
router.put('/:id', authenticateToken, sanitizeBody, async (req, res) => {
  try {
    const [existing] = await pool.execute('SELECT * FROM calendar_events WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (req.user.role === 'agent' && existing[0].agent_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const fields = [];
    const values = [];
    const allowed = ['title', 'description', 'type'];

    Object.keys(req.body).forEach((key) => {
      if (allowed.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    });

    if (req.body.start) {
      fields.push('start_time = ?');
      values.push(new Date(req.body.start).toISOString().slice(0, 19).replace('T', ' '));
    }
    if (req.body.end) {
      fields.push('end_time = ?');
      values.push(new Date(req.body.end).toISOString().slice(0, 19).replace('T', ' '));
    }

    if (fields.length > 0) {
      fields.push('updated_at = NOW()');
      values.push(req.params.id);
      await pool.execute(`UPDATE calendar_events SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    await logActivity('UPDATE_EVENT', `Updated calendar event: ${existing[0].title}`, req.user.name);

    const [rows] = await pool.execute('SELECT * FROM calendar_events WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE event (protected)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [existing] = await pool.execute('SELECT * FROM calendar_events WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (req.user.role === 'agent' && existing[0].agent_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.execute('DELETE FROM calendar_events WHERE id = ?', [req.params.id]);
    await logActivity('DELETE_EVENT', `Deleted calendar event: ${existing[0].title}`, req.user.name);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;
