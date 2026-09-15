require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { initializeDatabase } = require('./config/databaseInit');
const { testConnection } = require('./config/db');
const { notFound, errorHandler, logErrorResponses } = require('./middleware/errorHandler');
const { logError } = require('./utils/logger');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const couponRoutes = require('./routes/couponRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://koormcollection.com',
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(logErrorResponses);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

process.on('uncaughtException', (err) => {
  logError(err, null, { source: 'uncaughtException' });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logError(reason, null, { source: 'unhandledRejection' });
});

const PORT = process.env.PORT || 5000;

initializeDatabase()
  .then(() => testConnection())
  .then(() => {
    app.listen(PORT, () => console.log(`Koorm API server running on port ${PORT}`));
  })
  .catch((err) => {
    logError(err, null, { source: 'databaseInitialization' });
    process.exit(1);
  });
