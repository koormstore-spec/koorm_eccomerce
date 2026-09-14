const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/auth');
const { adminLogin, getAdminProfile } = require('../controllers/adminAuthController');

router.post('/login', adminLogin);
router.get('/me', protectAdmin, getAdminProfile);

module.exports = router;
