const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { sanitizeBody, validateEmail, containsMaliciousContent } = require('../middleware/sanitize');
const { inquiryLimiter } = require('../middleware/rateLimiter');
const logActivity = require('../middleware/logger');

const paginate = (total, data, page, limit) => ({
  data,
  pagination: { page, limit, total, pages: Math.ceil(total / limit) }
});

// GET agents/workload — must be before /:id
router.get('/agents/workload', authenticateToken, async (req, res) => {
  try {
    const [agents] = await pool.execute("SELECT id, name FROM users WHERE role = 'agent'");

    const workload = await Promise.all(
      agents.map(async (agent) => {
        const [[{ active }]] = await pool.execute(
          "SELECT COUNT(*) AS active FROM inquiries WHERE assigned_to = ? AND status NOT IN ('closed','cancelled')",
          [agent.id]
        );
        const [[{ total }]] = await pool.execute(
          'SELECT COUNT(*) AS total FROM inquiries WHERE assigned_to = ?',
          [agent.id]
        );
        const [[{ successful }]] = await pool.execute(
          "SELECT COUNT(*) AS successful FROM inquiries WHERE assigned_to = ? AND status = 'successful'",
          [agent.id]
        );
        return {
          agentId: agent.id,
          agentName: agent.name,
          activeInquiries: active,
          totalInquiries: total,
          successfulInquiries: successful
        };
      })
    );

    res.json(workload);
  } catch (error) {
    console.error('Failed to get agent workload:', error);
    res.status(500).json({ error: 'Failed to get agent workload' });
  }
});

// GET all inquiries (protected, paginated)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM inquiries');
    const [rows] = await pool.execute(
      'SELECT * FROM inquiries ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    res.json(paginate(total, rows, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

// GET single inquiry (protected)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM inquiries WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    const inquiry = rows[0];
    if (req.user.role === 'agent' && inquiry.assigned_to !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this inquiry' });
    }

    res.json(inquiry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inquiry' });
  }
});

// POST new inquiry (public, rate limited, sanitized)
router.post('/', sanitizeBody, inquiryLimiter, async (req, res) => {
  try {
    const fieldsToCheck = [req.body.name, req.body.message];
    if (fieldsToCheck.some((f) => containsMaliciousContent(f))) {
      await logActivity('XSS_ATTEMPT', `XSS attempt in inquiry from ${req.body.email}`, 'System');
      return res.status(400).json({ error: 'Invalid content detected.' });
    }

    if (!validateEmail(req.body.email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Duplicate check: same email + propertyId within 7 days, not closed/cancelled
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
    const [dups] = await pool.execute(
      "SELECT id, ticket_number AS ticketNumber, created_at AS createdAt FROM inquiries WHERE email = ? AND property_id = ? AND created_at > ? AND status NOT IN ('closed','cancelled')",
      [req.body.email, req.body.propertyId || null, sevenDaysAgo]
    );
    if (dups.length > 0) {
      await logActivity('DUPLICATE_INQUIRY', `Duplicate inquiry: ${req.body.email}`, 'System');
      return res.status(409).json({
        error: 'You have already submitted an inquiry for this property.',
        existingTicket: dups[0].ticketNumber,
        submittedAt: dups[0].createdAt
      });
    }

    // Generate ticket number INQ-YYYY-NNN
    const year = new Date().getFullYear();
    const [[{ cnt }]] = await pool.execute(
      "SELECT COUNT(*) AS cnt FROM inquiries WHERE ticket_number LIKE ?",
      [`INQ-${year}-%`]
    );
    const ticketNumber = `INQ-${year}-${String(cnt + 1).padStart(3, '0')}`;

    const id = uuidv4();
    await pool.execute(
      `INSERT INTO inquiries
        (id, ticket_number, name, email, phone, message, property_id, property_title, property_price, property_location, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', NOW(), NOW())`,
      [
        id,
        ticketNumber,
        req.body.name || '',
        req.body.email,
        req.body.phone || '',
        req.body.message || '',
        req.body.propertyId || null,
        req.body.propertyTitle || null,
        req.body.propertyPrice || null,
        req.body.propertyLocation || null
      ]
    );

    await logActivity('CREATE_INQUIRY', `New inquiry ${ticketNumber} from ${req.body.email}`, 'Public');

    const [rows] = await pool.execute('SELECT * FROM inquiries WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Failed to create inquiry:', error);
    res.status(500).json({ error: 'Failed to create inquiry' });
  }
});

// PUT update inquiry (protected)
router.put('/:id', authenticateToken, sanitizeBody, async (req, res) => {
  try {
    const [existing] = await pool.execute('SELECT * FROM inquiries WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    const allowed = ['status', 'name', 'email', 'phone', 'message', 'property_id', 'property_title', 'property_price', 'property_location', 'notes', 'last_follow_up_at', 'next_follow_up_at'];
    const mapping = {
      propertyId: 'property_id',
      propertyTitle: 'property_title',
      propertyPrice: 'property_price',
      propertyLocation: 'property_location',
      lastFollowUpAt: 'last_follow_up_at',
      nextFollowUpAt: 'next_follow_up_at'
    };

    const fields = [];
    const values = [];

    Object.keys(req.body).forEach((key) => {
      const col = mapping[key] || key;
      if (allowed.includes(col)) {
        fields.push(`${col} = ?`);
        values.push(typeof req.body[key] === 'object' ? JSON.stringify(req.body[key]) : req.body[key]);
      }
    });

    if (fields.length > 0) {
      fields.push('updated_at = NOW()');
      values.push(req.params.id);
      await pool.execute(`UPDATE inquiries SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    await logActivity('UPDATE_INQUIRY', `Updated inquiry ${existing[0].ticket_number}`, req.user.name);

    const [rows] = await pool.execute('SELECT * FROM inquiries WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update inquiry' });
  }
});

// DELETE inquiry (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT ticket_number FROM inquiries WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    await pool.execute('DELETE FROM inquiries WHERE id = ?', [req.params.id]);
    await logActivity('DELETE_INQUIRY', `Deleted inquiry: ${rows[0].ticket_number}`, req.user.name);

    res.json({ message: 'Inquiry deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete inquiry' });
  }
});

// POST claim inquiry (agent self-service)
router.post('/:id/claim', authenticateToken, requireRole(['agent']), async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM inquiries WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    const inquiry = rows[0];
    if (inquiry.assigned_to) {
      return res.status(409).json({ error: 'Ticket already claimed by another agent' });
    }

    await pool.execute(
      "UPDATE inquiries SET assigned_to = ?, claimed_by = ?, claimed_at = NOW(), status = 'claimed', updated_at = NOW() WHERE id = ?",
      [req.user.id, req.user.id, req.params.id]
    );

    await logActivity('CLAIM_INQUIRY', `Agent ${req.user.name} claimed inquiry ${inquiry.ticket_number}`, req.user.name);

    const [updated] = await pool.execute('SELECT * FROM inquiries WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Failed to claim inquiry:', error);
    res.status(500).json({ error: 'Failed to claim inquiry' });
  }
});

// POST assign inquiry (admin)
router.post('/:id/assign', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM inquiries WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    const { agentId, agentName } = req.body;

    await pool.execute(
      "UPDATE inquiries SET assigned_to = ?, assigned_by = ?, assigned_at = NOW(), status = 'assigned', updated_at = NOW() WHERE id = ?",
      [agentId, req.user.id, req.params.id]
    );

    await logActivity('ASSIGN_INQUIRY', `Admin ${req.user.name} assigned inquiry ${rows[0].ticket_number} to ${agentName}`, req.user.name);

    const [updated] = await pool.execute('SELECT * FROM inquiries WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Failed to assign inquiry:', error);
    res.status(500).json({ error: 'Failed to assign inquiry' });
  }
});

module.exports = router;
