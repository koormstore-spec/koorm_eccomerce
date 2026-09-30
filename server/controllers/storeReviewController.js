const { pool } = require('../config/db');

const selectReviews = `SELECT r.id, r.rating, r.comment, r.created_at,
  u.name AS user_name FROM store_reviews r JOIN users u ON u.id = r.user_id`;
const publicReview = review => {
  const names = String(review.user_name || 'Customer').trim().split(/\s+/);
  return { ...review, user_name: names[0] + (names.length > 1 ? ` ${names[names.length - 1][0]}.` : '') };
};

const getStoreReviews = async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 6);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || !Number.isInteger(limit) || limit < 1 || limit > 24) {
    return res.status(400).json({ message: 'Invalid review pagination' });
  }
  try {
    const [rows] = await pool.query(`${selectReviews} ORDER BY r.created_at DESC, r.id DESC LIMIT ? OFFSET ?`, [limit, (page - 1) * limit]);
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM store_reviews');
    res.json({ reviews: rows.map(publicReview), page, pages: Math.ceil(total / limit), total });
  } catch {
    res.status(500).json({ message: 'Could not load reviews. Please try again.' });
  }
};

const addStoreReview = async (req, res) => {
  const { rating, comment } = req.body;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Choose a whole-number rating from 1 to 5.' });
  }
  if (typeof comment !== 'string' || !comment.trim() || comment.trim().length > 1000) {
    return res.status(400).json({ message: 'Write a review of 1 to 1,000 characters.' });
  }
  try {
    const [result] = await pool.query('INSERT INTO store_reviews (user_id, rating, comment) VALUES (?, ?, ?)', [req.user.id, rating, comment.trim()]);
    const [[review]] = await pool.query(`${selectReviews} WHERE r.id = ?`, [result.insertId]);
    res.status(201).json({ message: 'Review submitted', review: publicReview(review) });
  } catch {
    res.status(500).json({ message: 'Could not save your review. Please try again.' });
  }
};

module.exports = { getStoreReviews, addStoreReview };
