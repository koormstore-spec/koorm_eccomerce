const { pool } = require('../config/db');

// Re-signing up (email already pending for this product) is a normal,
// silent no-op rather than a duplicate-key error.
const create = async (productId, email) => {
  await pool.query(
    `INSERT INTO stock_notifications (product_id, email)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE notified_at = NULL`,
    [productId, email]
  );
};

const findPendingByProduct = async (productId) => {
  const [rows] = await pool.query(
    'SELECT * FROM stock_notifications WHERE product_id = ? AND notified_at IS NULL',
    [productId]
  );
  return rows;
};

const markNotified = async (ids) => {
  if (!ids.length) return;
  await pool.query('UPDATE stock_notifications SET notified_at = NOW() WHERE id IN (?)', [ids]);
};

module.exports = { create, findPendingByProduct, markNotified };
