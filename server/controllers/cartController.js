const { pool } = require('../config/db');

const parseImages = (images) => {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  try {
    return JSON.parse(images);
  } catch {
    return [];
  }
};

const getCart = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ci.id, ci.size, ci.quantity, p.id AS product_id, p.name, p.slug, p.price,
              p.discount_price, p.images, p.stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ?
       ORDER BY ci.id DESC`,
      [req.user.id]
    );
    const items = rows.map((r) => ({
      ...r,
      images: parseImages(r.images),
    }));
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const addToCart = async (req, res) => {
  try {
    const { product_id, size, quantity = 1 } = req.body;
    if (!product_id || !size) {
      return res.status(400).json({ message: 'product_id and size are required' });
    }
    const [existing] = await pool.query(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ?',
      [req.user.id, product_id, size]
    );
    if (existing.length > 0) {
      await pool.query('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [
        quantity,
        existing[0].id,
      ]);
    } else {
      await pool.query(
        'INSERT INTO cart_items (user_id, product_id, size, quantity) VALUES (?, ?, ?, ?)',
        [req.user.id, product_id, size, quantity]
      );
    }
    res.status(201).json({ message: 'Added to cart' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'quantity must be at least 1' });
    }
    await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?', [
      quantity,
      req.params.id,
      req.user.id,
    ]);
    res.json({ message: 'Cart updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const removeCartItem = async (req, res) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.id,
    ]);
    res.json({ message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const clearCart = async (req, res) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
