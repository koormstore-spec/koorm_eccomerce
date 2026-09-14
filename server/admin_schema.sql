-- Koorm Admin Database
-- Fully separate from koorm_db (customer/catalog database).
-- Holds only admin accounts used to log into /admin.

CREATE DATABASE IF NOT EXISTS koorm_admin_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE koorm_admin_db;

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
