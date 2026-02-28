const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  };
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
};

module.exports = { authenticateToken, requireRole, generateToken };
