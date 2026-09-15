const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const databaseName = process.env.DB_NAME || 'koorm_db';
const quotedDatabaseName = `\`${databaseName.replace(/`/g, '``')}\``;

const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
  multipleStatements: true,
};

const readSql = (fileName) => fs.readFileSync(path.join(__dirname, '..', fileName), 'utf8');

const schemaDefinitions = () => {
  const schema = readSql('schema.sql');
  return schema.split('-- SEED DATA')[0].replace(/^.*?USE koorm_db;\s*/s, '');
};

const addColumnIfMissing = async (connection, tableName, columnName, definition) => {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS columnCount
     FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [tableName, columnName]
  );

  if (rows[0].columnCount === 0) {
    await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
  }
};

const dropColumnIfPresent = async (connection, tableName, columnName) => {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS columnCount
     FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [tableName, columnName]
  );

  if (rows[0].columnCount > 0) {
    await connection.query(`ALTER TABLE \`${tableName}\` DROP COLUMN \`${columnName}\``);
  }
};

const initializeDatabase = async () => {
  const connection = await mysql.createConnection(connectionConfig);

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${quotedDatabaseName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.query(`USE ${quotedDatabaseName}`);
    await connection.query(schemaDefinitions());
    await connection.query(readSql('admin_schema.sql').replace(/^.*?USE koorm_db;\s*/s, ''));

    await addColumnIfMissing(connection, 'users', 'is_verified', 'TINYINT(1) NOT NULL DEFAULT 0');
    await addColumnIfMissing(connection, 'users', 'verification_code', 'VARCHAR(255) NULL');
    await addColumnIfMissing(connection, 'users', 'verification_code_expiry', 'DATETIME NULL');
    await addColumnIfMissing(connection, 'orders', 'coupon_code', 'VARCHAR(40) NULL');
    await addColumnIfMissing(connection, 'orders', 'discount_amount', 'DECIMAL(10,2) NOT NULL DEFAULT 0');
    await addColumnIfMissing(connection, 'admins', 'verification_code', 'VARCHAR(64) NULL');
    await addColumnIfMissing(connection, 'admins', 'verification_code_expiry', 'DATETIME NULL');

    await dropColumnIfPresent(connection, 'users', 'password');
    await dropColumnIfPresent(connection, 'users', 'reset_token');
    await dropColumnIfPresent(connection, 'users', 'reset_token_expiry');

    await connection.query('ALTER TABLE admins MODIFY COLUMN password VARCHAR(255) NULL');
    console.log(`Database structure ready (${databaseName})`);
  } finally {
    await connection.end();
  }
};

module.exports = { initializeDatabase };
