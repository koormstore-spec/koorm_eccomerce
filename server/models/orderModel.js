const { pool } = require('../config/db');

const findByIdForUser = async (id, userId) => {
  const [rows] = await pool.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [id, userId]);
  return rows[0] || null;
};

const listByUserId = async (userId) => {
  const [rows] = await pool.query(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return rows;
};

const listItems = async (orderId) => {
  const [rows] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
  return rows;
};

module.exports = { findByIdForUser, listByUserId, listItems };
