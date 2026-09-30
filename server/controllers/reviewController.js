const { pool } = require('../config/db');

const reviewSelect = `SELECT r.id, r.product_id, r.rating, r.comment, r.created_at,
  u.name AS user_name, p.name AS product_name, p.slug AS product_slug, p.images
  FROM reviews r JOIN users u ON u.id = r.user_id JOIN products p ON p.id = r.product_id`;

const publicReview = ({ images, user_name, ...review }) => {
  let photos = images;
  if (typeof photos === 'string') {
    try { photos = JSON.parse(photos); } catch { photos = []; }
  }
  const names = String(user_name || 'Customer').trim().split(/\s+/);
  return { ...review, user_name: names[0] + (names.length > 1 ? ` ${names[names.length - 1][0]}.` : ''),
    product_image: Array.isArray(photos) ? photos[0] || null : null };
};

const getReviews = async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 6);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || !Number.isInteger(limit) || limit < 1 || limit > 24) {
    return res.status(400).json({ message: 'Invalid review pagination' });
  }
  try {
    const [rows] = await pool.query(`${reviewSelect} ORDER BY r.created_at DESC, r.id DESC LIMIT ? OFFSET ?`, [limit, (page - 1) * limit]);
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM reviews');
    res.json({ reviews: rows.map(publicReview), page, pages: Math.ceil(total / limit), total });
  } catch {
    res.status(500).json({ message: 'Could not load reviews. Please try again.' });
  }
};

const addReview = async (req, res) => {
  const { product_id, rating, comment = '' } = req.body;
  if (!Number.isSafeInteger(product_id) || product_id < 1 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Choose a product and a whole-number rating from 1 to 5.' });
  }
  if (typeof comment !== 'string' || comment.trim().length > 1000) {
    return res.status(400).json({ message: 'Your review must be text of no more than 1,000 characters.' });
  }
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    // Serialize rating changes for this product so the aggregate stays accurate.
    const [products] = await connection.query('SELECT id FROM products WHERE id = ? FOR UPDATE', [product_id]);
    if (!products.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Product not found' });
    }
    await connection.query(
      `INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)`,
      [product_id, req.user.id, rating, comment.trim()]
    );
    const [agg] = await connection.query(
      'SELECT AVG(rating) AS avgRating, COUNT(*) AS count FROM reviews WHERE product_id = ?',
      [product_id]
    );
    await connection.query('UPDATE products SET rating = ?, num_reviews = ? WHERE id = ?', [
      Number(agg[0].avgRating).toFixed(1),
      agg[0].count,
      product_id,
    ]);

    const [[review]] = await connection.query(`${reviewSelect} WHERE r.product_id = ? AND r.user_id = ?`, [product_id, req.user.id]);
    await connection.commit();
    res.status(201).json({ message: 'Review submitted', review: publicReview(review) });
  } catch {
    if (connection) await connection.rollback();
    res.status(500).json({ message: 'Could not save your review. Please try again.' });
  } finally {
    if (connection) connection.release();
  }
};

const deleteReview = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reviews WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }
    const productId = rows[0].product_id;
    await pool.query('DELETE FROM reviews WHERE id = ?', [req.params.id]);

    const [agg] = await pool.query(
      'SELECT AVG(rating) AS avgRating, COUNT(*) AS count FROM reviews WHERE product_id = ?',
      [productId]
    );
    await pool.query('UPDATE products SET rating = ?, num_reviews = ? WHERE id = ?', [
      agg[0].avgRating ? Number(agg[0].avgRating).toFixed(1) : 0,
      agg[0].count,
      productId,
    ]);

    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getReviews, addReview, deleteReview };
