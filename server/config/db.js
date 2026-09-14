const mysql = require('mysql2/promise');
require('dotenv').config();

const basePoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
};

// Customer-facing database: users, products, orders, cart, wishlist, reviews.
const pool = mysql.createPool({
  ...basePoolConfig,
  database: process.env.DB_NAME || 'koorm_db',
});

// Fully separate database holding only admin accounts.
const adminPool = mysql.createPool({
  ...basePoolConfig,
  database: process.env.ADMIN_DB_NAME || 'koorm_admin_db',
});

const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('MySQL connected successfully (koorm_db)');
    conn.release();

    const adminConn = await adminPool.getConnection();
    console.log('MySQL connected successfully (koorm_admin_db)');
    adminConn.release();
  } catch (err) {
    console.error('MySQL connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = { pool, adminPool, testConnection };
