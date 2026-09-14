const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { addReview, deleteReview } = require('../controllers/reviewController');

router.use(protect);
router.post('/', addReview);
router.delete('/:id', deleteReview);

module.exports = router;
