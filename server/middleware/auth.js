const jwt = require('jsonwebtoken');
const { pool, adminPool } = require('../config/db');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.query(
      'SELECT id, name, email, phone FROM users WHERE id = ?',
      [decoded.id]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Fully independent from `protect` — verifies against ADMIN_JWT_SECRET and
// the separate koorm_admin_db, never the customer users table.
const protectAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no admin token' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

    const [rows] = await adminPool.query(
      'SELECT id, name, email FROM admins WHERE id = ?',
      [decoded.id]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Not authorized, admin not found' });
    }
    req.admin = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, admin token failed' });
  }
};

module.exports = { protect, protectAdmin };
