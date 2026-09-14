const crypto = require('crypto');
const { pool } = require('../config/db');
const { generateToken } = require('../utils/generateToken');
const { sendWelcomeEmail, sendVerificationCodeEmail } = require('../utils/email');

const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const generateVerificationCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');

const issueVerificationCode = async (userId) => {
  const code = generateVerificationCode();
  const codeExpiry = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);
  await pool.query(
    'UPDATE users SET verification_code = ?, verification_code_expiry = ? WHERE id = ?',
    [hashToken(code), codeExpiry, userId]
  );
  return code;
};

const register = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const [existing] = await pool.query('SELECT id, is_verified FROM users WHERE email = ?', [email]);

    let userId;
    if (existing.length > 0) {
      if (existing[0].is_verified) {
        return res.status(400).json({ message: 'An account with this email already exists' });
      }
      // Unverified account from a previous, abandoned signup attempt — reuse
      // it and send a fresh code instead of blocking the user forever.
      userId = existing[0].id;
      await pool.query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone || null, userId]);
    } else {
      const [result] = await pool.query(
        'INSERT INTO users (name, email, phone) VALUES (?, ?, ?)',
        [name, email, phone || null]
      );
      userId = result.insertId;
    }

    const code = await issueVerificationCode(userId);

    res.status(201).json({
      message: "We've emailed you a verification code. Enter it to finish creating your account.",
      email,
    });

    sendVerificationCodeEmail({ name, email, code }).catch((err) =>
      console.error('Registration email dispatch failed:', err.message)
    );
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
      `SELECT id, name, phone, is_verified FROM users
       WHERE email = ? AND verification_code = ? AND verification_code_expiry > NOW()`,
      [email, hashToken(code)]
    );
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }
    if (rows[0].is_verified) {
      return res.status(400).json({ message: 'This account is already verified' });
    }

    const user = rows[0];
    await pool.query(
      'UPDATE users SET is_verified = 1, verification_code = NULL, verification_code_expiry = NULL WHERE id = ?',
      [user.id]
    );

    // Verification is the moment the account truly comes into existence, so
    // this doubles as first login: hand back a token right away.
    const token = generateToken(user.id);
    res.json({
      id: user.id,
      name: user.name,
      email,
      phone: user.phone,
      token,
    });

    sendWelcomeEmail({ name: user.name, email }).catch((err) =>
      console.error('Welcome email dispatch failed:', err.message)
    );
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

    const code = await issueVerificationCode(rows[0].id);
    sendVerificationCodeEmail({ name: rows[0].name, email, code }).catch((err) =>
      console.error('Verification code email dispatch failed:', err.message)
    );

    res.json({ message: 'A new verification code has been sent to your email.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Passwordless login, step 1: email a one-time code to a verified account.
const requestLoginCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const [rows] = await pool.query('SELECT id, name, is_verified FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No account found with that email' });
    }
    if (!rows[0].is_verified) {
      return res.status(400).json({ message: 'Please finish verifying your email first', unverified: true });
    }

    const code = await issueVerificationCode(rows[0].id);
    sendVerificationCodeEmail({ name: rows[0].name, email, code }).catch((err) =>
      console.error('Login code email dispatch failed:', err.message)
    );

    res.json({ message: 'A login code has been sent to your email.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Passwordless login, step 2: exchange the code for a session token.
const verifyLoginCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const [rows] = await pool.query(
      `SELECT id, name, phone FROM users
       WHERE email = ? AND verification_code = ? AND verification_code_expiry > NOW()`,
      [email, hashToken(code)]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid or expired code' });
    }

    const user = rows[0];
    await pool.query(
      'UPDATE users SET verification_code = NULL, verification_code_expiry = NULL WHERE id = ?',
      [user.id]
    );

    const token = generateToken(user.id);
    res.json({ id: user.id, name: user.name, email, phone: user.phone, token });
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

module.exports = {
  register,
  requestLoginCode,
  verifyLoginCode,
  getProfile,
  updateProfile,
  listAddresses,
  addAddress,
  deleteAddress,
  verifyEmail,
  resendVerificationCode,
};
