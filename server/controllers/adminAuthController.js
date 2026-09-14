const bcrypt = require('bcryptjs');
const { adminPool } = require('../config/db');
const { generateAdminToken } = require('../utils/generateToken');

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const [rows] = await adminPool.query('SELECT * FROM admins WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = generateAdminToken(admin.id);
    res.json({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAdminProfile = async (req, res) => {
  res.json(req.admin);
};

module.exports = { adminLogin, getAdminProfile };
