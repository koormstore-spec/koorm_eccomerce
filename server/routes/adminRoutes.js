const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/auth');
const { getDashboardStats } = require('../controllers/adminController');

router.get('/stats', protectAdmin, getDashboardStats);

module.exports = router;
