const { pool } = require('../config/db');

const addReview = async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;
    if (!product_id || !rating) {
      return res.status(400).json({ message: 'product_id and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'rating must be between 1 and 5' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM reviews WHERE product_id = ? AND user_id = ?',
      [product_id, req.user.id]
    );
    if (existing.length > 0) {
      await pool.query('UPDATE reviews SET rating = ?, comment = ? WHERE id = ?', [
        rating,
        comment || '',
        existing[0].id,
      ]);
    } else {
      await pool.query(
        'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
        [product_id, req.user.id, rating, comment || '']
      );
    }

    const [agg] = await pool.query(
      'SELECT AVG(rating) AS avgRating, COUNT(*) AS count FROM reviews WHERE product_id = ?',
      [product_id]
    );
    await pool.query('UPDATE products SET rating = ?, num_reviews = ? WHERE id = ?', [
      Number(agg[0].avgRating).toFixed(1),
      agg[0].count,
      product_id,
    ]);

    res.status(201).json({ message: 'Review submitted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
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

module.exports = { addReview, deleteReview };
