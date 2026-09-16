jest.mock('../config/db', () => ({
  pool: { query: jest.fn() },
}));
jest.mock('../utils/email', () => ({
  sendBackInStockEmail: jest.fn().mockResolvedValue({ sent: true }),
}));

const { pool } = require('../config/db');
const { sendBackInStockEmail } = require('../utils/email');
const { notifyRestock, updateProduct, getProducts } = require('../controllers/productController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('notifyRestock', () => {
  it('rejects a missing or malformed email', async () => {
    const req = { params: { id: 1 }, body: { email: 'not-an-email' } };
    const res = mockRes();

    await notifyRestock(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('404s for a product that does not exist', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    const req = { params: { id: 99 }, body: { email: 'shopper@example.com' } };
    const res = mockRes();

    await notifyRestock(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('does not queue a signup for an item that is already in stock', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, stock: 12 }]]);
    const req = { params: { id: 1 }, body: { email: 'shopper@example.com' } };
    const res = mockRes();

    await notifyRestock(req, res);

    expect(res.json).toHaveBeenCalledWith({ message: 'This item is already in stock.' });
    expect(pool.query).toHaveBeenCalledTimes(1); // only the lookup — no insert
  });

  it('queues a signup, lowercased, for a sold-out product', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 1, stock: 0 }]]) // lookup
      .mockResolvedValueOnce([{}]); // insert
    const req = { params: { id: 1 }, body: { email: 'Shopper@Example.com' } };
    const res = mockRes();

    await notifyRestock(req, res);

    const insertCall = pool.query.mock.calls[1];
    expect(insertCall[1]).toEqual([1, 'shopper@example.com']);
    expect(res.json).toHaveBeenCalledWith({
      message: "You're on the list — we'll email you the moment this is back.",
    });
  });
});

describe('updateProduct restock notifications', () => {
  const currentProduct = {
    id: 1, name: 'Linen Shirt', slug: 'linen-shirt', stock: 0, price: 2499,
    description: '', discount_price: null, category_id: 1, brand: 'Koorm',
    gender: 'unisex', sizes: '[]', colors: '[]', images: '["/img.jpg"]', is_featured: 0,
  };

  it('emails pending subscribers when stock moves from zero to available', async () => {
    pool.query
      .mockResolvedValueOnce([[currentProduct]]) // existing lookup
      .mockResolvedValueOnce([{}]) // update
      .mockResolvedValueOnce([[{ ...currentProduct, stock: 10 }]]) // select back
      .mockResolvedValueOnce([[{ id: 5, email: 'waiting@example.com' }]]) // pending notifications
      .mockResolvedValueOnce([{}]); // markNotified
    const req = { params: { id: 1 }, body: { stock: 10 } };
    const res = mockRes();

    await updateProduct(req, res);
    await new Promise((resolve) => setImmediate(resolve)); // let the fire-and-forget branch run

    expect(res.json).toHaveBeenCalled();
    expect(sendBackInStockEmail).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'linen-shirt' }),
      'waiting@example.com'
    );
  });

  it('does not touch stock notifications when stock stays above zero', async () => {
    pool.query
      .mockResolvedValueOnce([[{ ...currentProduct, stock: 20 }]])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([[{ ...currentProduct, stock: 15 }]]);
    const req = { params: { id: 1 }, body: { stock: 15 } };
    const res = mockRes();

    await updateProduct(req, res);
    await new Promise((resolve) => setImmediate(resolve));

    expect(sendBackInStockEmail).not.toHaveBeenCalled();
  });
});

describe('getProducts filtering', () => {
  const respond = () => {
    pool.query
      .mockResolvedValueOnce([[]]) // products
      .mockResolvedValueOnce([[{ total: 0 }]]); // count
  };

  it('matches a product carrying any of several requested sizes', async () => {
    respond();
    const req = { query: { sizes: 'M, L' } };
    const res = mockRes();

    await getProducts(req, res);

    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toMatch(/JSON_CONTAINS\(p\.sizes, JSON_QUOTE\(\?\)\) OR JSON_CONTAINS\(p\.sizes, JSON_QUOTE\(\?\)\)/);
    expect(params.slice(0, 2)).toEqual(['M', 'L']);
  });

  it('filters to discounted products when onSale is set', async () => {
    respond();
    const req = { query: { onSale: 'true' } };
    const res = mockRes();

    await getProducts(req, res);

    const [sql] = pool.query.mock.calls[0];
    expect(sql).toContain('p.discount_price IS NOT NULL AND p.discount_price < p.price');
  });

  it('filters to in-stock products when inStock is set', async () => {
    respond();
    const req = { query: { inStock: '1' } };
    const res = mockRes();

    await getProducts(req, res);

    const [sql] = pool.query.mock.calls[0];
    expect(sql).toContain('p.stock > 0');
  });

  it('filters by a minimum rating', async () => {
    respond();
    const req = { query: { minRating: '4' } };
    const res = mockRes();

    await getProducts(req, res);

    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toContain('p.rating >= ?');
    expect(params[0]).toBe(4);
  });

  it('applies no extra filtering when none of the new filters are given', async () => {
    respond();
    const req = { query: {} };
    const res = mockRes();

    await getProducts(req, res);

    const [sql] = pool.query.mock.calls[0];
    expect(sql).not.toMatch(/WHERE/);
  });
});
