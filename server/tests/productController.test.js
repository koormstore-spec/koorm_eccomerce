jest.mock('../config/db', () => ({ pool: { query: jest.fn() } }));
const { pool } = require('../config/db');
const { getProducts, updateProductStock } = require('../controllers/productController');

beforeEach(() => jest.resetAllMocks());
const response = () => ({ json: jest.fn(), status: jest.fn().mockReturnThis() });

test.each([-1, 1.5, null, '2', 2147483648])('rejects invalid stock %p without writing inventory', async stock => {
  const res = response();
  await updateProductStock({ body: { stock }, params: { id: 1 } }, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(pool.query).not.toHaveBeenCalled();
});

test('updates only stock, retaining the product details in the response', async () => {
  const product = { id: 1, name: 'Linen Shirt', price: 2499, stock: 2, sizes: '["M"]', colors: '["White"]', images: '["/photo.jpg"]' };
  pool.query.mockResolvedValueOnce([{ affectedRows: 1 }]).mockResolvedValueOnce([[product]]);
  const res = response();
  await updateProductStock({ body: { stock: 2 }, params: { id: '1' } }, res);
  expect(pool.query.mock.calls[0]).toEqual(['UPDATE products SET stock = ? WHERE id = ?', [2, '1']]);
  expect(res.json).toHaveBeenCalledWith({ ...product, sizes: ['M'], colors: ['White'], images: ['/photo.jpg'] });
});

test('reports a missing product when saving stock', async () => {
  pool.query.mockResolvedValueOnce([{ affectedRows: 0 }]).mockResolvedValueOnce([[]]);
  const res = response();
  await updateProductStock({ body: { stock: 2 }, params: { id: '999' } }, res);
  expect(res.status).toHaveBeenCalledWith(404);
});

test('combines catalogue filters and applies the same conditions to pagination totals', async () => {
  pool.query.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[{ total: 0 }]]);
  const res = response();
  await getProducts({ query: { sale: 'true', inStock: 'true', size: 'M', color: 'Blue', minPrice: '100', maxPrice: '3000', page: '2', limit: '12', sort: 'price_asc' } }, res);
  const [listSql, listParams] = pool.query.mock.calls[0];
  const [countSql, countParams] = pool.query.mock.calls[1];
  for (const sql of [listSql, countSql]) {
    expect(sql).toContain('p.discount_price > 0 AND p.discount_price < p.price');
    expect(sql).toContain('p.stock > 0');
    expect(sql).toContain('JSON_CONTAINS(p.sizes, ?)');
    expect(sql).toContain('LOWER(p.colors) LIKE ?');
  }
  expect(listSql).toContain('ORDER BY COALESCE(p.discount_price, p.price) ASC');
  expect(listParams).toEqual([100, 3000, '"M"', '%blue%', 12, 12]);
  expect(countParams).toEqual(listParams.slice(0, -2));
  expect(res.json).toHaveBeenCalledWith({ products: [], total: 0, page: 2, pages: 0 });
});

test('false flags do not hide stock or full-price products and values stay parameterized', async () => {
  pool.query.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[{ total: 0 }]]);
  const res = response();
  const input = "Blue' OR 1=1 --";
  await getProducts({ query: { sale: 'false', inStock: 'false', color: input } }, res);
  const [sql, params] = pool.query.mock.calls[0];
  expect(sql).not.toContain('p.stock > 0');
  expect(sql).not.toContain('p.discount_price > 0');
  expect(sql).not.toContain(input);
  expect(params[0]).toBe(`%${input.toLowerCase()}%`);
});
