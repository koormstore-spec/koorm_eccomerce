const { pool } = require('../config/db');
const { sendOrderConfirmationToCustomer, sendOrderNotificationToAdmin, sendOrderCancellationToAdmin, sendOrderStatusUpdateToCustomer } = require('../utils/email');
const { evaluateCoupon } = require('./couponController');

const parseImages = (images) => {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  try {
    return JSON.parse(images);
  } catch {
    return [];
  }
};

const generateOrderNumber = () => {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `KRM${Date.now().toString().slice(-6)}${rand}`;
};

const FREE_SHIPPING_THRESHOLD = 1999;
const SHIPPING_FEE = 99;

const createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { shipping_name, shipping_phone, shipping_address_line1, shipping_address_line2,
      shipping_city, shipping_state, shipping_pincode, coupon_code } = req.body;

    if (!shipping_name || !shipping_phone || !shipping_address_line1 || !shipping_city || !shipping_state || !shipping_pincode) {
      connection.release();
      return res.status(400).json({ message: 'Complete shipping address is required' });
    }

    const [cartRows] = await connection.query(
      `SELECT ci.id, ci.size, ci.quantity, p.id AS product_id, p.name, p.images,
              COALESCE(p.discount_price, p.price) AS price, p.stock
       FROM cart_items ci JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = ?`,
      [req.user.id]
    );

    if (cartRows.length === 0) {
      connection.release();
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    for (const item of cartRows) {
      if (item.stock < item.quantity) {
        connection.release();
        return res.status(400).json({ message: `${item.name} has insufficient stock` });
      }
    }

    const itemsTotal = cartRows.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const shippingFee = itemsTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

    // Re-validated here (not trusted from the client) so a coupon that
    // expired, hit its usage limit, or never existed can't be applied.
    let discountAmount = 0;
    let appliedCoupon = null;
    if (coupon_code) {
      const [coupons] = await connection.query('SELECT * FROM coupons WHERE code = ?', [
        coupon_code.trim().toUpperCase(),
      ]);
      if (coupons.length === 0) {
        connection.release();
        return res.status(400).json({ message: 'Invalid coupon code' });
      }
      const result = evaluateCoupon(coupons[0], itemsTotal);
      if (result.error) {
        connection.release();
        return res.status(400).json({ message: result.error });
      }
      discountAmount = result.discountAmount;
      appliedCoupon = coupons[0];
    }

    const totalAmount = itemsTotal + shippingFee - discountAmount;
    const orderNumber = generateOrderNumber();

    await connection.beginTransaction();

    const [orderResult] = await connection.query(
      `INSERT INTO orders
       (user_id, order_number, items_total, shipping_fee, coupon_code, discount_amount, total_amount, payment_method, status,
        shipping_name, shipping_phone, shipping_address_line1, shipping_address_line2,
        shipping_city, shipping_state, shipping_pincode)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'COD', 'placed', ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, orderNumber, itemsTotal, shippingFee, appliedCoupon ? appliedCoupon.code : null, discountAmount, totalAmount,
        shipping_name, shipping_phone, shipping_address_line1, shipping_address_line2 || null,
        shipping_city, shipping_state, shipping_pincode]
    );
    const orderId = orderResult.insertId;

    for (const item of cartRows) {
      const images = parseImages(item.images);
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, size, quantity, price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.name, images[0] || null, item.size, item.quantity, item.price]
      );
      await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [
        item.quantity,
        item.product_id,
      ]);
    }

    await connection.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);

    if (appliedCoupon) {
      await connection.query('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [appliedCoupon.id]);
    }

    await connection.commit();
    connection.release();

    const orderForEmail = {
      customerEmail: req.user.email,
      customerName: req.user.name,
      order_number: orderNumber,
      items: cartRows.map((item) => ({
        product_name: item.name,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
      })),
      items_total: itemsTotal,
      shipping_fee: shippingFee,
      coupon_code: appliedCoupon ? appliedCoupon.code : null,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      shipping_name,
      shipping_phone,
      shipping_address_line1,
      shipping_address_line2,
      shipping_city,
      shipping_state,
      shipping_pincode,
    };

    // Fire-and-forget: email delivery must never block or fail an already-placed order.
    Promise.all([
      sendOrderConfirmationToCustomer(orderForEmail),
      sendOrderNotificationToAdmin(orderForEmail),
    ]).catch((err) => console.error('Order email dispatch failed:', err.message));

    res.status(201).json({
      id: orderId,
      order_number: orderNumber,
      items_total: itemsTotal,
      shipping_fee: shippingFee,
      coupon_code: appliedCoupon ? appliedCoupon.code : null,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      status: 'placed',
      payment_method: 'COD',
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
    res.status(500).json({ message: err.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    for (const order of orders) {
      const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = items;
    }
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.id,
    ]);
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [
      req.params.id,
    ]);
    res.json({ ...orders[0], items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.id,
    ]);
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (['shipped', 'delivered', 'cancelled'].includes(orders[0].status)) {
      return res.status(400).json({ message: `Cannot cancel an order that is ${orders[0].status}` });
    }
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', ['cancelled', req.params.id]);
    res.json({ message: 'Order cancelled' });

    // Fire-and-forget, isolated from the response above.
    (async () => {
      try {
        const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
        const cancelledOrder = {
          customerEmail: req.user.email,
          customerName: req.user.name,
          order_number: orders[0].order_number,
          status: 'cancelled',
          items,
          total_amount: orders[0].total_amount,
          shipping_name: orders[0].shipping_name,
          shipping_city: orders[0].shipping_city,
          shipping_state: orders[0].shipping_state,
          shipping_pincode: orders[0].shipping_pincode,
        };
        await Promise.all([
          sendOrderStatusUpdateToCustomer(cancelledOrder),
          sendOrderCancellationToAdmin(cancelledOrder),
        ]);
      } catch (err) {
        console.error('Order cancellation email dispatch failed:', err.message);
      }
    })();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---- Admin ----
const getAllOrders = async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, u.name AS customer_name, u.email AS customer_email
       FROM orders o JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Order status updated' });

    // Fire-and-forget, isolated from the response above: email delivery must
    // never block, fail, or double-respond to the status update request.
    (async () => {
      try {
        const [orders] = await pool.query(
          `SELECT o.*, u.name AS customer_name, u.email AS customer_email
           FROM orders o JOIN users u ON o.user_id = u.id
           WHERE o.id = ?`,
          [req.params.id]
        );
        if (orders.length === 0) return;
        const order = orders[0];
        const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
        await sendOrderStatusUpdateToCustomer({
          customerEmail: order.customer_email,
          customerName: order.customer_name,
          order_number: order.order_number,
          status,
          items,
          total_amount: order.total_amount,
          shipping_name: order.shipping_name,
          shipping_city: order.shipping_city,
          shipping_state: order.shipping_state,
          shipping_pincode: order.shipping_pincode,
        });
      } catch (err) {
        console.error('Order status email dispatch failed:', err.message);
      }
    })();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
};
