const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getReviews, addReview, deleteReview } = require('../controllers/reviewController');
const { getStoreReviews, addStoreReview } = require('../controllers/storeReviewController');

router.get('/', getReviews);
router.get('/store', getStoreReviews);
router.use(protect);
router.post('/store', addStoreReview);
router.post('/', addReview);
router.delete('/:id', deleteReview);

module.exports = router;
