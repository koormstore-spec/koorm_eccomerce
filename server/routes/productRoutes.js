const express = require('express');
const router = express.Router();
const { protectAdmin } = require('../middleware/auth');
const {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  notifyRestock,
} = require('../controllers/productController');

router.get('/', getProducts);
router.post('/:id/notify-restock', notifyRestock);
router.get('/:slug', getProductBySlug);
router.post('/', protectAdmin, createProduct);
router.put('/:id', protectAdmin, updateProduct);
router.delete('/:id', protectAdmin, deleteProduct);

module.exports = router;
