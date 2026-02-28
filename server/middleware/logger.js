const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

const logActivity = async (action, description, performedBy) => {
  try {
    await pool.execute(
      'INSERT INTO activity_log (id, action, description, performed_by, timestamp) VALUES (?, ?, ?, ?, NOW())',
      [uuidv4(), action, description, performedBy]
    );
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
};

module.exports = logActivity;
