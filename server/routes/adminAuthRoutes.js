const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/auth');
const {
  adminLogin,
  requestAdminSetupCode,
  verifyAdminSetup,
  getAdminProfile,
} = require('../controllers/adminAuthController');

router.post('/login', adminLogin);
router.post('/request-setup-code', requestAdminSetupCode);
router.post('/verify-setup', verifyAdminSetup);
router.get('/me', protectAdmin, getAdminProfile);

module.exports = router;
