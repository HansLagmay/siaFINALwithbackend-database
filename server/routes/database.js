const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Map filename → table name
const FILE_TABLE_MAP = {
  'properties.json': 'properties',
  'inquiries.json': 'inquiries',
  'users.json': 'users',
  'calendar-events.json': 'calendar_events',
  'activity-log.json': 'activity_log',
};

// Map recent type → table info (table names are hardcoded — not from user input)
const RECENT_TYPE_MAP = {
  properties: { table: 'properties', timestampCol: 'created_at', where: null },
  inquiries: { table: 'inquiries', timestampCol: 'created_at', where: null },
  agents: { table: 'users', timestampCol: 'created_at', where: "role = 'agent'" },
};

// GET database overview (admin only)
router.get('/overview', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [[{ totalProperties }]] = await pool.execute('SELECT COUNT(*) AS totalProperties FROM properties');
    const [[{ newProperties }]] = await pool.execute(
      "SELECT COUNT(*) AS newProperties FROM properties WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
    );
    const [[{ totalInquiries }]] = await pool.execute('SELECT COUNT(*) AS totalInquiries FROM inquiries');
    const [[{ newInquiries }]] = await pool.execute(
      "SELECT COUNT(*) AS newInquiries FROM inquiries WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
    );
    const [[{ totalUsers }]] = await pool.execute('SELECT COUNT(*) AS totalUsers FROM users');
    const [[{ totalAdmins }]] = await pool.execute("SELECT COUNT(*) AS totalAdmins FROM users WHERE role = 'admin'");
    const [[{ totalAgents }]] = await pool.execute("SELECT COUNT(*) AS totalAgents FROM users WHERE role = 'agent'");
    const [[{ newAgents }]] = await pool.execute(
      "SELECT COUNT(*) AS newAgents FROM users WHERE role = 'agent' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
    );
    const [[{ totalCalendar }]] = await pool.execute('SELECT COUNT(*) AS totalCalendar FROM calendar_events');
    const [[{ totalActivity }]] = await pool.execute('SELECT COUNT(*) AS totalActivity FROM activity_log');
    const [[{ last24h }]] = await pool.execute(
      "SELECT COUNT(*) AS last24h FROM activity_log WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)"
    );

    // Inquiry status breakdown
    const [statusRows] = await pool.execute(
      'SELECT status, COUNT(*) AS cnt FROM inquiries GROUP BY status'
    );
    const byStatus = {};
    statusRows.forEach((r) => { byStatus[r.status] = r.cnt; });

    // Last activity
    const [lastAct] = await pool.execute('SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT 1');

    res.json({
      properties: { total: totalProperties, new: newProperties },
      inquiries: { total: totalInquiries, new: newInquiries, byStatus },
      users: { total: totalUsers, admins: totalAdmins, agents: totalAgents, new: newAgents },
      calendar: { total: totalCalendar },
      activityLog: { total: totalActivity, last24Hours: last24h },
      lastActivity: lastAct[0] || null
    });
  } catch (error) {
    console.error('Error fetching overview:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET file metadata (table stats)
router.get('/file-metadata/:filename', authenticateToken, requireRole(['admin']), async (req, res) => {
  const table = FILE_TABLE_MAP[req.params.filename];
  if (!table) return res.status(404).json({ error: 'Unknown file' });
  try {
    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM \`${table}\``);
    const [[lastRow]] = await pool.execute(
      `SELECT * FROM \`${table}\` ORDER BY id DESC LIMIT 1`
    );
    res.json({
      filename: req.params.filename,
      table,
      recordCount: total,
      lastModified: lastRow ? (lastRow.updated_at || lastRow.created_at || lastRow.timestamp || null) : null,
    });
  } catch (error) {
    console.error('Error fetching file metadata:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET all records from a table (file)
router.get('/file/:filename', authenticateToken, requireRole(['admin']), async (req, res) => {
  const table = FILE_TABLE_MAP[req.params.filename];
  if (!table) return res.status(404).json({ error: 'Unknown file' });
  try {
    const [rows] = await pool.execute(`SELECT * FROM \`${table}\``);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching file data:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET recent records (last 7 days)
router.get('/recent/:type', authenticateToken, requireRole(['admin']), async (req, res) => {
  const mapping = RECENT_TYPE_MAP[req.params.type];
  if (!mapping) return res.status(404).json({ error: 'Unknown type' });
  try {
    // Table and column names come from the hardcoded RECENT_TYPE_MAP — not from user input
    const whereExtra = mapping.where ? ` AND ${mapping.where}` : '';
    const [rows] = await pool.execute(
      `SELECT * FROM \`${mapping.table}\` WHERE \`${mapping.timestampCol}\` >= DATE_SUB(NOW(), INTERVAL 7 DAY)${whereExtra} ORDER BY \`${mapping.timestampCol}\` DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching recent records:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST clear-new (no-op — MySQL has no separate "new" tracking files)
router.post('/clear-new/:type', authenticateToken, requireRole(['admin']), (req, res) => {
  res.json({ success: true, message: 'Cleared' });
});

// GET export as CSV
router.get('/export/:filename/csv', authenticateToken, requireRole(['admin']), async (req, res) => {
  const table = FILE_TABLE_MAP[req.params.filename];
  if (!table) return res.status(404).json({ error: 'Unknown file' });
  try {
    const [rows] = await pool.execute(`SELECT * FROM \`${table}\``);
    if (rows.length === 0) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename.replace('.json', '.csv')}"`);
      return res.send('');
    }
    const headers = Object.keys(rows[0]);
    const csvRows = [headers.join(',')];
    for (const row of rows) {
      csvRows.push(headers.map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
      }).join(','));
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename.replace('.json', '.csv')}"`);
    res.send(csvRows.join('\n'));
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET export as JSON
router.get('/export/:filename/json', authenticateToken, requireRole(['admin']), async (req, res) => {
  const table = FILE_TABLE_MAP[req.params.filename];
  if (!table) return res.status(404).json({ error: 'Unknown file' });
  try {
    const [rows] = await pool.execute(`SELECT * FROM \`${table}\``);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
    res.send(JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error('Error exporting JSON:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
