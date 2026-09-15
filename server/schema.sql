-- Koorm Clothing E-Commerce Database Schema
-- Run this file against MySQL to create the database, tables, and seed data.
-- Admin accounts use the shared database — see admin_schema.sql.
-- This database (koorm_db) holds only customers and catalog/order data.

CREATE DATABASE IF NOT EXISTS koorm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE koorm_db;

-- ---------- USERS (customers only) ----------
-- Passwordless: identity is proven by emailed one-time codes, both at
-- registration and at login. See migrations/002_drop_password.sql for
-- upgrading an existing database that still has the old password column.
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20),
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  verification_code VARCHAR(255) NULL,
  verification_code_expiry DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- ADDRESSES ----------
CREATE TABLE IF NOT EXISTS addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(12) NOT NULL,
  is_default TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------- CATEGORIES ----------
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  image_url VARCHAR(500)
);

-- ---------- PRODUCTS ----------
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  discount_price DECIMAL(10,2),
  category_id INT,
  brand VARCHAR(100) DEFAULT 'Koorm',
  gender ENUM('men', 'women', 'unisex', 'kids') DEFAULT 'unisex',
  sizes JSON,
  colors JSON,
  images JSON,
  stock INT DEFAULT 100,
  rating DECIMAL(2,1) DEFAULT 0,
  num_reviews INT DEFAULT 0,
  is_featured TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ---------- CART ----------
CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  size VARCHAR(20) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_cart_item (user_id, product_id, size),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ---------- WISHLIST ----------
CREATE TABLE IF NOT EXISTS wishlist_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_wishlist_item (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ---------- COUPONS ----------
CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  discount_type ENUM('percent','flat') NOT NULL DEFAULT 'percent',
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_discount_amount DECIMAL(10,2) NULL,
  usage_limit INT NULL,
  used_count INT NOT NULL DEFAULT 0,
  expires_at DATETIME NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- ORDERS ----------
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  order_number VARCHAR(30) NOT NULL UNIQUE,
  items_total DECIMAL(10,2) NOT NULL,
  shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  coupon_code VARCHAR(40) NULL,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(30) NOT NULL DEFAULT 'COD',
  status ENUM('placed','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'placed',
  shipping_name VARCHAR(120) NOT NULL,
  shipping_phone VARCHAR(20) NOT NULL,
  shipping_address_line1 VARCHAR(255) NOT NULL,
  shipping_address_line2 VARCHAR(255),
  shipping_city VARCHAR(100) NOT NULL,
  shipping_state VARCHAR(100) NOT NULL,
  shipping_pincode VARCHAR(12) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------- ORDER ITEMS ----------
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT,
  product_name VARCHAR(200) NOT NULL,
  product_image VARCHAR(500),
  size VARCHAR(20),
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- ---------- REVIEWS ----------
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_review (product_id, user_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================================
-- SEED DATA
-- =========================================================

INSERT INTO categories (name, slug, image_url) VALUES
('Men', 'men', 'https://picsum.photos/seed/koorm-men/600/700')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Real product photography: Linen & Textured Shirt line, 15 colorways.
-- Images are served from client/public/images/products/<1-15>/<1-7>.jpg
-- (source photos: D:\koorm_pic\koorm-15, resized to 1000px width, optimized JPEG)
INSERT INTO products (name, slug, description, price, discount_price, category_id, brand, gender, sizes, colors, images, stock, rating, num_reviews, is_featured) VALUES
('Linen Shirt - Rust Red', 'linen-shirt-rust-red', 'A relaxed-fit full-sleeve shirt woven from a breathable linen-cotton blend. Button-down collar and mother-of-pearl buttons for an elevated everyday look.', 2499.00, 1899.00, 1, 'Koorm', 'men', '["S","M","L","XL","XXL"]', '["Rust Red"]', '["/images/products/1/1.jpg","/images/products/1/2.jpg","/images/products/1/3.jpg","/images/products/1/4.jpg","/images/products/1/5.jpg","/images/products/1/6.jpg","/images/products/1/7.jpg"]', 60, 4.5, 32, 1),
('Linen Shirt - Navy Heather', 'linen-shirt-navy-heather', 'A relaxed-fit full-sleeve shirt woven from a breathable linen-cotton blend. Button-down collar and mother-of-pearl buttons for an elevated everyday look.', 2499.00, 1899.00, 1, 'Koorm', 'men', '["S","M","L","XL","XXL"]', '["Navy Heather"]', '["/images/products/2/1.jpg","/images/products/2/2.jpg","/images/products/2/3.jpg","/images/products/2/4.jpg","/images/products/2/5.jpg","/images/products/2/6.jpg","/images/products/2/7.jpg"]', 60, 4.4, 28, 1),
('Linen Shirt - Charcoal Grey', 'linen-shirt-charcoal-grey', 'A relaxed-fit full-sleeve shirt woven from a breathable linen-cotton blend. Button-down collar and mother-of-pearl buttons for an elevated everyday look.', 2499.00, 1899.00, 1, 'Koorm', 'men', '["S","M","L","XL","XXL"]', '["Charcoal Grey"]', '["/images/products/3/1.jpg","/images/products/3/2.jpg","/images/products/3/3.jpg","/images/products/3/4.jpg","/images/products/3/5.jpg","/images/products/3/6.jpg","/images/products/3/7.jpg"]', 60, 4.3, 21, 0),
('Linen Shirt - Sage Green', 'linen-shirt-sage-green', 'A relaxed-fit full-sleeve shirt woven from a breathable linen-cotton blend. Button-down collar and mother-of-pearl buttons for an elevated everyday look.', 2499.00, 1899.00, 1, 'Koorm', 'men', '["S","M","L","XL","XXL"]', '["Sage Green"]', '["/images/products/4/1.jpg","/images/products/4/2.jpg","/images/products/4/3.jpg","/images/products/4/4.jpg","/images/products/4/5.jpg","/images/products/4/6.jpg","/images/products/4/7.jpg"]', 60, 4.6, 40, 1),
('Linen Shirt - Olive Green', 'linen-shirt-olive-green', 'A relaxed-fit full-sleeve shirt woven from a breathable linen-cotton blend. Button-down collar and mother-of-pearl buttons for an elevated everyday look.', 2499.00, 1899.00, 1, 'Koorm', 'men', '["S","M","L","XL","XXL"]', '["Olive Green"]', '["/images/products/5/1.jpg","/images/products/5/2.jpg","/images/products/5/3.jpg","/images/products/5/4.jpg","/images/products/5/5.jpg","/images/products/5/6.jpg","/images/products/5/7.jpg"]', 60, 4.2, 18, 0),
('Linen Shirt - Forest Green', 'linen-shirt-forest-green', 'A relaxed-fit full-sleeve shirt woven from a breathable linen-cotton blend. Button-down collar and mother-of-pearl buttons for an elevated everyday look.', 2499.00, 1899.00, 1, 'Koorm', 'men', '["S","M","L","XL","XXL"]', '["Forest Green"]', '["/images/products/6/1.jpg","/images/products/6/2.jpg","/images/products/6/3.jpg","/images/products/6/4.jpg","/images/products/6/5.jpg","/images/products/6/6.jpg","/images/products/6/7.jpg"]', 60, 4.4, 25, 0),
('Linen Shirt - Lemon Yellow', 'linen-shirt-lemon-yellow', 'A relaxed-fit full-sleeve shirt woven from a breathable linen-cotton blend. Button-down collar and mother-of-pearl buttons for an elevated everyday look.', 2499.00, 1899.00, 1, 'Koorm', 'men', '["S","M","L","XL","XXL"]', '["Lemon Yellow"]', '["/images/products/7/1.jpg","/images/products/7/2.jpg","/images/products/7/3.jpg","/images/products/7/4.jpg","/images/products/7/5.jpg","/images/products/7/6.jpg","/images/products/7/7.jpg"]', 60, 4.1, 14, 0),
('Linen Shirt - Camel Beige', 'linen-shirt-camel-beige', 'A relaxed-fit full-sleeve shirt woven from a breathable linen-cotton blend. Button-down collar and mother-of-pearl buttons for an elevated everyday look.', 2499.00, 1899.00, 1, 'Koorm', 'men', '["S","M","L","XL","XXL"]', '["Camel Beige"]', '["/images/products/8/1.jpg","/images/products/8/2.jpg","/images/products/8/3.jpg","/images/products/8/4.jpg","/images/products/8/5.jpg","/images/products/8/6.jpg","/images/products/8/7.jpg"]', 60, 4.5, 30, 1),
('Textured Shirt - White', 'textured-shirt-white', 'A relaxed-fit full-sleeve shirt in a subtly textured seersucker-style cotton weave. Button-down collar for a crisp, elevated look.', 2599.00, 1999.00, 1, 'Koorm', 'men', '["S","M","L","XL","XXL"]', '["White"]', '["/images/products/9/1.jpg","/images/products/9/2.jpg","/images/products/9/3.jpg","/images/products/9/4.jpg","/images/products/9/5.jpg","/images/products/9/6.jpg","/images/products/9/7.jpg"]', 60, 4.6, 44, 1),
('Linen Shirt - Dusty Pink', 'linen-shirt-dusty-pink', 'A relaxed-fit full-sleeve shirt woven from a breathable linen-cotton blend. Button-down collar and mother-of-pearl buttons for an elevated everyday look.', 2499.00, 1899.00, 1, 'Koorm', 'men', '["S","M","L","XL","XXL"]', '["Dusty Pink"]', '["/images/products/10/1.jpg","/images/products/10/2.jpg","/images/products/10/3.jpg","/images/products/10/4.jpg","/images/products/10/5.jpg","/images/products/10/6.jpg","/images/products/10/7.jpg"]', 60, 4.3, 19, 0),
('Linen Shirt - Mauve Brown', 'linen-shirt-mauve-brown', 'A relaxed-fit full-sleeve shirt woven from a breathable linen-cotton blend. Button-down collar and mother-of-pearl buttons for an elevated everyday look.', 2499.00, 1899.00, 1, 'Koorm', 'men', '["S","M","L","XL","XXL"]', '["Mauve Brown"]', '["/images/products/11/1.jpg","/images/products/11/2.jpg","/images/products/11/3.jpg","/images/products/11/4.jpg","/images/products/11/5.jpg","/images/products/11/6.jpg","/images/products/11/7.jpg"]', 60, 4.2, 16, 0),
('Linen Shirt - Ivory Cream', 'linen-shirt-ivory-cream', 'A relaxed-fit full-sleeve shirt woven from a breathable linen-cotton blend. Button-down collar and mother-of-pearl buttons for an elevated everyday look.', 2499.00, 1899.00, 1, 'Koorm', 'men', '["S","M","L","XL","XXL"]', '["Ivory Cream"]', '["/images/products/12/1.jpg","/images/products/12/2.jpg","/images/products/12/3.jpg","/images/products/12/4.jpg","/images/products/12/5.jpg","/images/products/12/6.jpg","/images/products/12/7.jpg"]', 60, 4.4, 23, 0),
('Linen Shirt - Denim Blue', 'linen-shirt-denim-blue', 'A relaxed-fit full-sleeve shirt woven from a breathable linen-cotton blend. Button-down collar and mother-of-pearl buttons for an elevated everyday look.', 2499.00, 1899.00, 1, 'Koorm', 'men', '["S","M","L","XL","XXL"]', '["Denim Blue"]', '["/images/products/13/1.jpg","/images/products/13/2.jpg","/images/products/13/3.jpg","/images/products/13/4.jpg","/images/products/13/5.jpg","/images/products/13/6.jpg","/images/products/13/7.jpg"]', 60, 4.5, 27, 1),
('Linen Shirt - Sand Stone', 'linen-shirt-sand-stone', 'A relaxed-fit full-sleeve shirt woven from a breathable linen-cotton blend. Button-down collar and mother-of-pearl buttons for an elevated everyday look.', 2499.00, 1899.00, 1, 'Koorm', 'men', '["S","M","L","XL","XXL"]', '["Sand Stone"]', '["/images/products/14/1.jpg","/images/products/14/2.jpg","/images/products/14/3.jpg","/images/products/14/4.jpg","/images/products/14/5.jpg","/images/products/14/6.jpg","/images/products/14/7.jpg"]', 60, 4.1, 12, 0),
('Linen Shirt - Light Grey Melange', 'linen-shirt-light-grey-melange', 'A relaxed-fit full-sleeve shirt woven from a breathable linen-cotton blend. Button-down collar and mother-of-pearl buttons for an elevated everyday look.', 2499.00, 1899.00, 1, 'Koorm', 'men', '["S","M","L","XL","XXL"]', '["Light Grey Melange"]', '["/images/products/15/1.jpg","/images/products/15/2.jpg","/images/products/15/3.jpg","/images/products/15/4.jpg","/images/products/15/5.jpg","/images/products/15/6.jpg","/images/products/15/7.jpg"]', 60, 4.3, 20, 0)
ON DUPLICATE KEY UPDATE name = VALUES(name);
