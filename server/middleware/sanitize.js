// Basic string sanitization without external dependencies
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const sanitize = (obj) => {
      Object.keys(obj).forEach((key) => {
        if (typeof obj[key] === 'string') {
          obj[key] = sanitizeString(obj[key]);
        } else if (Array.isArray(obj[key])) {
          obj[key] = obj[key].map((item) =>
            typeof item === 'string' ? sanitizeString(item) : item
          );
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        }
      });
    };
    sanitize(req.body);
  }
  next();
};

const validateEmail = (email) => {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const containsMaliciousContent = (str) => {
  if (typeof str !== 'string') return false;
  return /<script|onerror|onload|javascript:/i.test(str);
};

module.exports = { sanitizeBody, validateEmail, containsMaliciousContent };
