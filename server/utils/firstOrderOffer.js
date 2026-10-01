const FIRST_ORDER_CODE = 'FIRST30';

const firstOrderError = async (database, userId, code, lock = false) => {
  if (String(code).toUpperCase() !== FIRST_ORDER_CODE) return null;
  const [orders] = await database.query(`SELECT id FROM orders WHERE user_id = ? LIMIT 1${lock ? ' FOR UPDATE' : ''}`, [userId]);
  return orders.length ? 'FIRST30 is available on your first order only.' : null;
};

module.exports = { FIRST_ORDER_CODE, firstOrderError };
