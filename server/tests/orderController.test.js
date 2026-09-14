jest.mock('../config/db', () => ({
  pool: { query: jest.fn(), getConnection: jest.fn() },
}));
jest.mock('../utils/email', () => ({
  sendOrderConfirmationToCustomer: jest.fn().mockResolvedValue({ sent: true }),
  sendOrderNotificationToAdmin: jest.fn().mockResolvedValue({ sent: true }),
  sendOrderCancellationToAdmin: jest.fn().mockResolvedValue({ sent: true }),
  sendOrderStatusUpdateToCustomer: jest.fn().mockResolvedValue({ sent: true }),
}));

const { pool } = require('../config/db');
const {
  sendOrderConfirmationToCustomer,
  sendOrderNotificationToAdmin,
  sendOrderCancellationToAdmin,
  sendOrderStatusUpdateToCustomer,
} = require('../utils/email');
const { createOrder, cancelOrder, updateOrderStatus } = require('../controllers/orderController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// The controller's email dispatch for cancelOrder/updateOrderStatus runs in a
// detached async IIFE (fire-and-forget after the response). Flushing the
// microtask queue via a macrotask tick lets that chain finish before we assert.
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const makeConnection = () => ({
  query: jest.fn(),
  beginTransaction: jest.fn().mockResolvedValue(),
  commit: jest.fn().mockResolvedValue(),
  rollback: jest.fn().mockResolvedValue(),
  release: jest.fn(),
});

describe('createOrder', () => {
  it('rejects when the shipping address is incomplete', async () => {
    const connection = makeConnection();
    pool.getConnection.mockResolvedValueOnce(connection);
    const req = { user: { id: 1 }, body: { shipping_name: 'Jane' } };
    const res = mockRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(connection.release).toHaveBeenCalled();
    expect(connection.query).not.toHaveBeenCalled();
  });

  it('rejects when the cart is empty', async () => {
    const connection = makeConnection();
    connection.query.mockResolvedValueOnce([[]]); // cart lookup -> empty
    pool.getConnection.mockResolvedValueOnce(connection);
    const req = { user: { id: 1 }, body: fullShippingBody() };
    const res = mockRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Your cart is empty' });
  });

  it('rejects when a cart item exceeds available stock', async () => {
    const connection = makeConnection();
    connection.query.mockResolvedValueOnce([[
      { id: 1, size: 'M', quantity: 5, product_id: 9, name: 'Linen Shirt', images: '[]', price: 1899, stock: 2 },
    ]]);
    pool.getConnection.mockResolvedValueOnce(connection);
    const req = { user: { id: 1 }, body: fullShippingBody() };
    const res = mockRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Linen Shirt has insufficient stock' });
    expect(connection.beginTransaction).not.toHaveBeenCalled();
  });

  it('places the order, commits, and notifies both customer and admin by email', async () => {
    const connection = makeConnection();
    connection.query
      .mockResolvedValueOnce([[
        { id: 1, size: 'M', quantity: 2, product_id: 9, name: 'Linen Shirt', images: '["/img.jpg"]', price: 500, stock: 10 },
      ]]) // cart lookup
      .mockResolvedValueOnce([{ insertId: 55 }]) // INSERT order
      .mockResolvedValueOnce([{}]) // INSERT order_items
      .mockResolvedValueOnce([{}]) // UPDATE stock
      .mockResolvedValueOnce([{}]); // DELETE cart_items
    pool.getConnection.mockResolvedValueOnce(connection);
    const req = { user: { id: 1, name: 'Jane', email: 'jane@example.com' }, body: fullShippingBody() };
    const res = mockRes();

    await createOrder(req, res);

    expect(connection.commit).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    const payload = res.json.mock.calls[0][0];
    expect(payload.items_total).toBe(1000); // 500 * 2, below the 1999 free-shipping threshold
    expect(payload.shipping_fee).toBe(99);
    expect(payload.total_amount).toBe(1099);

    expect(sendOrderConfirmationToCustomer).toHaveBeenCalledTimes(1);
    expect(sendOrderNotificationToAdmin).toHaveBeenCalledTimes(1);
    const emailArg = sendOrderConfirmationToCustomer.mock.calls[0][0];
    expect(emailArg.customerEmail).toBe('jane@example.com');
    expect(emailArg.order_number).toBe(payload.order_number);
  });

  it('waives shipping once the order total meets the free-shipping threshold', async () => {
    const connection = makeConnection();
    connection.query
      .mockResolvedValueOnce([[
        { id: 1, size: 'M', quantity: 1, product_id: 9, name: 'Linen Shirt', images: '[]', price: 2500, stock: 10 },
      ]])
      .mockResolvedValueOnce([{ insertId: 56 }])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}]);
    pool.getConnection.mockResolvedValueOnce(connection);
    const req = { user: { id: 1, name: 'Jane', email: 'jane@example.com' }, body: fullShippingBody() };
    const res = mockRes();

    await createOrder(req, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.shipping_fee).toBe(0);
    expect(payload.total_amount).toBe(2500);
  });

  it('rolls back the transaction if something fails after it has begun', async () => {
    const connection = makeConnection();
    connection.query
      .mockResolvedValueOnce([[
        { id: 1, size: 'M', quantity: 1, product_id: 9, name: 'Linen Shirt', images: '[]', price: 1000, stock: 10 },
      ]])
      .mockRejectedValueOnce(new Error('db exploded')); // INSERT order fails
    pool.getConnection.mockResolvedValueOnce(connection);
    const req = { user: { id: 1, name: 'Jane', email: 'jane@example.com' }, body: fullShippingBody() };
    const res = mockRes();

    await createOrder(req, res);

    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('cancelOrder', () => {
  const baseOrder = {
    id: 3,
    order_number: 'KRM123456',
    status: 'placed',
    total_amount: 1998,
    shipping_name: 'Jane',
    shipping_city: 'Pune',
    shipping_state: 'Maharashtra',
    shipping_pincode: '411001',
  };

  it('returns 404 when the order does not belong to the requesting user', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    const req = { params: { id: 3 }, user: { id: 1, name: 'Jane', email: 'jane@example.com' } };
    const res = mockRes();

    await cancelOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('refuses to cancel an order that has already shipped', async () => {
    pool.query.mockResolvedValueOnce([[{ ...baseOrder, status: 'shipped' }]]);
    const req = { params: { id: 3 }, user: { id: 1, name: 'Jane', email: 'jane@example.com' } };
    const res = mockRes();

    await cancelOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Cannot cancel an order that is shipped' });
  });

  it('cancels the order and notifies BOTH the customer and the admin by email', async () => {
    pool.query
      .mockResolvedValueOnce([[baseOrder]]) // ownership/status lookup
      .mockResolvedValueOnce([{}]) // UPDATE orders SET status='cancelled'
      .mockResolvedValueOnce([[{ product_name: 'Linen Shirt', size: 'M', quantity: 1, price: 1899 }]]); // order_items
    const req = { params: { id: 3 }, user: { id: 1, name: 'Jane', email: 'jane@example.com' } };
    const res = mockRes();

    await cancelOrder(req, res);
    await flushPromises();

    expect(res.json).toHaveBeenCalledWith({ message: 'Order cancelled' });

    // Regression test: previously only the customer was notified on
    // customer-initiated cancellation, leaving the admin unaware.
    expect(sendOrderStatusUpdateToCustomer).toHaveBeenCalledTimes(1);
    expect(sendOrderCancellationToAdmin).toHaveBeenCalledTimes(1);

    const customerArg = sendOrderStatusUpdateToCustomer.mock.calls[0][0];
    const adminArg = sendOrderCancellationToAdmin.mock.calls[0][0];
    expect(customerArg.order_number).toBe('KRM123456');
    expect(customerArg.status).toBe('cancelled');
    expect(adminArg.order_number).toBe('KRM123456');
    expect(adminArg.customerEmail).toBe('jane@example.com');
  });
});

describe('updateOrderStatus (admin)', () => {
  it('rejects an invalid status value', async () => {
    const req = { params: { id: 3 }, body: { status: 'not-a-real-status' } };
    const res = mockRes();

    await updateOrderStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('updates the status and emails the customer', async () => {
    pool.query
      .mockResolvedValueOnce([{}]) // UPDATE orders
      .mockResolvedValueOnce([[{
        order_number: 'KRM123456',
        customer_name: 'Jane',
        customer_email: 'jane@example.com',
        total_amount: 1998,
        shipping_name: 'Jane',
        shipping_city: 'Pune',
        shipping_state: 'Maharashtra',
        shipping_pincode: '411001',
      }]]) // order + customer lookup
      .mockResolvedValueOnce([[]]); // order_items
    const req = { params: { id: 3 }, body: { status: 'shipped' } };
    const res = mockRes();

    await updateOrderStatus(req, res);
    await flushPromises();

    expect(res.json).toHaveBeenCalledWith({ message: 'Order status updated' });
    expect(sendOrderStatusUpdateToCustomer).toHaveBeenCalledTimes(1);
    expect(sendOrderStatusUpdateToCustomer.mock.calls[0][0]).toMatchObject({
      status: 'shipped',
      customerEmail: 'jane@example.com',
      order_number: 'KRM123456',
    });
  });
});

function fullShippingBody() {
  return {
    shipping_name: 'Jane',
    shipping_phone: '9998887777',
    shipping_address_line1: '1 Main St',
    shipping_city: 'Pune',
    shipping_state: 'Maharashtra',
    shipping_pincode: '411001',
  };
}
