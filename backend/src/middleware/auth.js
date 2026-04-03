const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  let token = req.cookies && req.cookies.aspo_token;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.userId, role: payload.role, office_id: payload.officeId || null };
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Session expired. Please log in again.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions.' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
