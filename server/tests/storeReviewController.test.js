jest.mock('../config/db', () => ({ pool: { query: jest.fn() } }));
const { pool } = require('../config/db');
const { getStoreReviews, addStoreReview } = require('../controllers/storeReviewController');
const response = () => ({ json: jest.fn(), status: jest.fn().mockReturnThis() });
const review = { id: 1, rating: 5, comment: 'Great experience', user_name: 'Test Customer' };
beforeEach(() => jest.resetAllMocks());

test('saves a general review without a product and uses the signed-in customer', async () => {
  pool.query.mockResolvedValueOnce([{ affectedRows: 1, insertId: 1 }]).mockResolvedValueOnce([[review]]);
  const res = response();
  await addStoreReview({ body: { rating: 5, comment: ' Great experience ', user_id: 999 }, user: { id: 3 } }, res);
  expect(pool.query.mock.calls[0][1]).toEqual([3, 5, 'Great experience']);
  expect(pool.query.mock.calls[0][0]).not.toContain('UPDATE');
  expect(pool.query.mock.calls[1][1]).toEqual([1]);
  expect(res.json).toHaveBeenCalledWith({ message: 'Review submitted', review: { ...review, user_name: 'Test C.' } });
});

test.each([{ rating: 0 }, { rating: 2.5 }, { rating: 6 }, { comment: '  ' }, { comment: {} }, { comment: 'a'.repeat(1001) }])('rejects invalid review %p', async invalid => {
  const res = response();
  await addStoreReview({ body: { rating: 5, comment: 'Great experience', ...invalid }, user: { id: 3 } }, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(pool.query).not.toHaveBeenCalled();
});

test('returns saved reviews with pagination and abbreviated names', async () => {
  pool.query.mockResolvedValueOnce([[review]]).mockResolvedValueOnce([[{ total: 7 }]]);
  const res = response();
  await getStoreReviews({ query: { page: 2, limit: 6 } }, res);
  expect(pool.query.mock.calls[0][1]).toEqual([6, 6]);
  expect(res.json).toHaveBeenCalledWith({ reviews: [{ ...review, user_name: 'Test C.' }], page: 2, pages: 2, total: 7 });
});

test('reports a save failure without claiming success', async () => {
  pool.query.mockRejectedValue(new Error('offline'));
  const res = response();
  await addStoreReview({ body: { rating: 5, comment: 'Great experience' }, user: { id: 3 } }, res);
  expect(res.status).toHaveBeenCalledWith(500);
});
