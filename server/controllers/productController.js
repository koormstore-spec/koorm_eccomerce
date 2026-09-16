const { pool } = require('../config/db');
const { stockNotificationModel } = require('../models');
const { sendBackInStockEmail } = require('../utils/email');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseProduct = (row) => {
  if (!row) return row;
  const parseField = (field) => {
    if (field == null) return [];
    if (Array.isArray(field)) return field;
    try {
      return JSON.parse(field);
    } catch {
      return [];
    }
  };
  return {
    ...row,
    sizes: parseField(row.sizes),
    colors: parseField(row.colors),
    images: parseField(row.images),
  };
};

const getProducts = async (req, res) => {
  try {
    const {
      category,
      gender,
      search,
      minPrice,
      maxPrice,
      sort,
      featured,
      sizes,
      onSale,
      inStock,
      minRating,
      page = 1,
      limit = 20,
    } = req.query;

    const where = [];
    const params = [];

    if (category) {
      where.push('c.slug = ?');
      params.push(category);
    }
    if (gender) {
      where.push('p.gender = ?');
      params.push(gender);
    }
    if (search) {
      where.push('(p.name LIKE ? OR p.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (minPrice) {
      where.push('COALESCE(p.discount_price, p.price) >= ?');
      params.push(Number(minPrice));
    }
    if (maxPrice) {
      where.push('COALESCE(p.discount_price, p.price) <= ?');
      params.push(Number(maxPrice));
    }
    if (featured) {
      where.push('p.is_featured = 1');
    }
    // Matches a product carrying ANY of the requested sizes (not all of them).
    const sizeList = sizes ? sizes.split(',').map((value) => value.trim()).filter(Boolean) : [];
    if (sizeList.length > 0) {
      where.push(`(${sizeList.map(() => 'JSON_CONTAINS(p.sizes, JSON_QUOTE(?))').join(' OR ')})`);
      params.push(...sizeList);
    }
    if (onSale === 'true' || onSale === '1') {
      where.push('p.discount_price IS NOT NULL AND p.discount_price < p.price');
    }
    if (inStock === 'true' || inStock === '1') {
      where.push('p.stock > 0');
    }
    if (minRating) {
      where.push('p.rating >= ?');
      params.push(Number(minRating));
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    let orderBy = 'p.created_at DESC';
    if (sort === 'price_asc') orderBy = 'COALESCE(p.discount_price, p.price) ASC';
    if (sort === 'price_desc') orderBy = 'COALESCE(p.discount_price, p.price) DESC';
    if (sort === 'rating') orderBy = 'p.rating DESC';
    if (sort === 'newest') orderBy = 'p.created_at DESC';

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM products p LEFT JOIN categories c ON p.category_id = c.id ${whereClause}`,
      params
    );

    res.json({
      products: rows.map(parseProduct),
      total: countRows[0].total,
      page: pageNum,
      pages: Math.ceil(countRows[0].total / limitNum),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getProductBySlug = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = ?`,
      [req.params.slug]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const [reviews] = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS user_name
       FROM reviews r JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ? ORDER BY r.created_at DESC`,
      [rows[0].id]
    );

    const [related] = await pool.query(
      `SELECT p.* FROM products p WHERE p.category_id = ? AND p.id != ? LIMIT 4`,
      [rows[0].category_id, rows[0].id]
    );

    res.json({
      ...parseProduct(rows[0]),
      reviews,
      related: related.map(parseProduct),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const {
      name, slug, description, price, discount_price, category_id,
      brand, gender, sizes, colors, images, stock, is_featured,
    } = req.body;

    if (!name || !slug || !price) {
      return res.status(400).json({ message: 'name, slug and price are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO products
       (name, slug, description, price, discount_price, category_id, brand, gender, sizes, colors, images, stock, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, slug, description || '', price, discount_price || null, category_id || null,
        brand || 'Koorm', gender || 'unisex',
        JSON.stringify(sizes || []), JSON.stringify(colors || []), JSON.stringify(images || []),
        stock ?? 100, is_featured ? 1 : 0,
      ]
    );
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json(parseProduct(rows[0]));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const existing = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (existing[0].length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const current = existing[0][0];
    const {
      name, slug, description, price, discount_price, category_id,
      brand, gender, sizes, colors, images, stock, is_featured,
    } = req.body;
    const nextStock = stock ?? current.stock;

    await pool.query(
      `UPDATE products SET name=?, slug=?, description=?, price=?, discount_price=?, category_id=?,
       brand=?, gender=?, sizes=?, colors=?, images=?, stock=?, is_featured=? WHERE id=?`,
      [
        name ?? current.name,
        slug ?? current.slug,
        description ?? current.description,
        price ?? current.price,
        discount_price ?? current.discount_price,
        category_id ?? current.category_id,
        brand ?? current.brand,
        gender ?? current.gender,
        sizes ? JSON.stringify(sizes) : current.sizes,
        colors ? JSON.stringify(colors) : current.colors,
        images ? JSON.stringify(images) : current.images,
        nextStock,
        is_featured !== undefined ? (is_featured ? 1 : 0) : current.is_featured,
        req.params.id,
      ]
    );
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    const updated = parseProduct(rows[0]);
    res.json(updated);

    // Just came back from sold-out: tell everyone who asked to be notified.
    // Fire-and-forget, isolated from the response already sent above.
    if (Number(current.stock) <= 0 && Number(nextStock) > 0) {
      (async () => {
        try {
          const pending = await stockNotificationModel.findPendingByProduct(req.params.id);
          if (pending.length === 0) return;
          await Promise.all(
            pending.map((subscription) =>
              sendBackInStockEmail({ ...updated, image: updated.images?.[0] }, subscription.email)
            )
          );
          await stockNotificationModel.markNotified(pending.map((subscription) => subscription.id));
        } catch (err) {
          console.error('Back-in-stock email dispatch failed:', err.message);
        }
      })();
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Public: a visitor asks to be emailed once a sold-out product is available
// again. Silently accepts a re-signup, and still succeeds (without queuing
// anything) if the item turns out not to be sold out — no error to leak
// stock levels to a caller who hasn't seen the page.
const notifyRestock = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !EMAIL_PATTERN.test(email.trim())) {
      return res.status(400).json({ message: 'A valid email address is required' });
    }

    const [rows] = await pool.query('SELECT id, stock FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (Number(rows[0].stock) > 0) {
      return res.json({ message: 'This item is already in stock.' });
    }

    await stockNotificationModel.create(req.params.id, email.trim().toLowerCase());
    res.json({ message: "You're on the list — we'll email you the moment this is back." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  notifyRestock,
};
