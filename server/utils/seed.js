// Creates a default admin account in the separate admin database. Run with: npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { adminPool } = require('../config/db');

const ADMIN_EMAIL = 'admin@koorm.com';
const ADMIN_PASSWORD = 'Admin@123';

(async () => {
  try {
    const [existing] = await adminPool.query('SELECT id FROM admins WHERE email = ?', [ADMIN_EMAIL]);
    if (existing.length > 0) {
      console.log('Admin account already exists:', ADMIN_EMAIL);
      process.exit(0);
    }
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await adminPool.query(
      'INSERT INTO admins (name, email, password) VALUES (?, ?, ?)',
      ['Koorm Admin', ADMIN_EMAIL, hashed]
    );
    console.log('Admin account created in koorm_admin_db:');
    console.log('  email:', ADMIN_EMAIL);
    console.log('  password:', ADMIN_PASSWORD);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
})();
