const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

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

module.exports = router;
