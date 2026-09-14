const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../config/db');
const { generateToken } = require('../utils/generateToken');
const { sendWelcomeEmail, sendVerificationCodeEmail, sendPasswordResetEmail } = require('../utils/email');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const generateVerificationCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');

const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
      [name, email, hashed, phone || null]
    );

    const code = generateVerificationCode();
    const codeExpiry = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);
    await pool.query(
      'UPDATE users SET verification_code = ?, verification_code_expiry = ? WHERE id = ?',
      [hashToken(code), codeExpiry, result.insertId]
    );

    const token = generateToken(result.insertId);
    res.status(201).json({
      id: result.insertId,
      name,
      email,
      phone: phone || null,
      is_verified: false,
      token,
    });

    // Fire-and-forget, isolated from the response above.
    Promise.all([
      sendWelcomeEmail({ name, email }),
      sendVerificationCodeEmail({ name, email, code }),
    ]).catch((err) => console.error('Registration email dispatch failed:', err.message));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const [rows] = await pool.query(
      `SELECT id, is_verified FROM users
       WHERE email = ? AND verification_code = ? AND verification_code_expiry > NOW()`,
      [email, hashToken(code)]
    );
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }
    if (rows[0].is_verified) {
      return res.status(400).json({ message: 'This account is already verified' });
    }

    await pool.query(
      'UPDATE users SET is_verified = 1, verification_code = NULL, verification_code_expiry = NULL WHERE id = ?',
      [rows[0].id]
    );

    res.json({ message: 'Email verified successfully.', verified: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const [rows] = await pool.query('SELECT id, name, is_verified FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No account found with that email' });
    }
    if (rows[0].is_verified) {
      return res.status(400).json({ message: 'This account is already verified' });
    }

    const code = generateVerificationCode();
    const codeExpiry = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);
    await pool.query(
      'UPDATE users SET verification_code = ?, verification_code_expiry = ? WHERE id = ?',
      [hashToken(code), codeExpiry, rows[0].id]
    );

    sendVerificationCodeEmail({ name: rows[0].name, email, code }).catch((err) =>
      console.error('Verification code email dispatch failed:', err.message)
    );

    res.json({ message: 'A new verification code has been sent to your email.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = generateToken(user.id);
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getProfile = async (req, res) => {
  res.json(req.user);
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    await pool.query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [
      name || req.user.name,
      phone !== undefined ? phone : req.user.phone,
      req.user.id,
    ]);
    const [rows] = await pool.query(
      'SELECT id, name, email, phone FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const listAddresses = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addAddress = async (req, res) => {
  try {
    const { full_name, phone, address_line1, address_line2, city, state, pincode, is_default } = req.body;
    if (!full_name || !phone || !address_line1 || !city || !state || !pincode) {
      return res.status(400).json({ message: 'Missing required address fields' });
    }
    if (is_default) {
      await pool.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }
    const [result] = await pool.query(
      `INSERT INTO addresses (user_id, full_name, phone, address_line1, address_line2, city, state, pincode, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, full_name, phone, address_line1, address_line2 || null, city, state, pincode, is_default ? 1 : 0]
    );
    const [rows] = await pool.query('SELECT * FROM addresses WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteAddress = async (req, res) => {
  try {
    await pool.query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Address removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const GENERIC_FORGOT_PASSWORD_MESSAGE =
  'If an account exists with that email, a password reset link has been sent.';

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const [rows] = await pool.query('SELECT id, name, email FROM users WHERE email = ?', [email]);

    // Always respond the same way, regardless of whether the account exists,
    // so this endpoint can't be used to discover which emails are registered.
    if (rows.length > 0) {
      const user = rows[0];
      const rawToken = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + RESET_TOKEN_TTL_MS);

      await pool.query('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?', [
        hashToken(rawToken),
        expiry,
        user.id,
      ]);

      const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${rawToken}`;
      sendPasswordResetEmail({ name: user.name, email: user.email, resetUrl }).catch((err) =>
        console.error('Password reset email dispatch failed:', err.message)
      );
    }

    res.json({ message: GENERIC_FORGOT_PASSWORD_MESSAGE });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const [rows] = await pool.query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
      [hashToken(token)]
    );
    if (rows.length === 0) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [hashed, rows[0].id]
    );

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  listAddresses,
  addAddress,
  deleteAddress,
  verifyEmail,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
};
