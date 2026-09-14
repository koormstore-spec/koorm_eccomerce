const nodemailer = require('nodemailer');

let cachedTransporter = null;

// Falls back to an Ethereal test inbox (preview URL logged to console) when no
// real SMTP credentials are configured, and to a console-only simulation if
// even that fails — so order placement never breaks for lack of email setup.
const createTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    return cachedTransporter;
  }

  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.warn('EMAIL_USER/EMAIL_PASS not set — using a temporary Ethereal test inbox for emails.');
    return cachedTransporter;
  } catch (err) {
    console.warn('Ethereal test account unavailable, falling back to console simulation:', err.message);
    cachedTransporter = {
      sendMail: async (mailOptions) => {
        console.log('--- EMAIL DISPATCH SIMULATION ---');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        return { messageId: 'simulated-' + Date.now() };
      },
    };
    return cachedTransporter;
  }
};

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'koormstore@gmail.com';
const FROM_ADDRESS = process.env.EMAIL_USER ? `"Koorm Store" <${process.env.EMAIL_USER}>` : '"Koorm Store" <orders@koorm.com>';

const formatCurrency = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

const itemsListHtml = (items) =>
  items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;">
          <strong>${item.product_name || item.name}</strong><br/>
          <span style="color:#666;font-size:12px;">Size: ${item.size}</span>
        </td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(item.price)}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${formatCurrency(item.price * item.quantity)}</td>
      </tr>`
    )
    .join('');

const emailShell = (headerSubtitle, bodyHtml) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
    <div style="background-color:#1a1a1a;color:#ffffff;padding:20px;text-align:center;">
      <h1 style="margin:0;font-size:24px;letter-spacing:2px;">KOORM</h1>
      <p style="margin:5px 0 0;color:#c8a97e;font-size:14px;">${headerSubtitle}</p>
    </div>
    <div style="padding:24px;background-color:#ffffff;">${bodyHtml}</div>
  </div>
`;

const addressBlockHtml = (order) => `
  <div style="background-color:#f9f9f9;padding:16px;border-radius:6px;margin:20px 0;">
    <h3 style="margin-top:0;font-size:14px;text-transform:uppercase;color:#666;">Delivery Address</h3>
    <p style="margin:4px 0;color:#333;"><strong>${order.shipping_name}</strong></p>
    <p style="margin:4px 0;color:#333;">${order.shipping_address_line1}${order.shipping_address_line2 ? `, ${order.shipping_address_line2}` : ''}</p>
    <p style="margin:4px 0;color:#333;">${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}</p>
    <p style="margin:4px 0;color:#333;">Phone: ${order.shipping_phone}</p>
    <p style="margin:4px 0;color:#333;">Email: ${order.customerEmail}</p>
  </div>
`;

const orderSummaryTableHtml = (order) => `
  <h3 style="font-size:14px;text-transform:uppercase;color:#666;margin-top:24px;">Order Summary</h3>
  <table style="width:100%;border-collapse:collapse;margin-top:10px;">
    <thead>
      <tr style="background-color:#f1f1f1;text-align:left;">
        <th style="padding:10px;">Item</th>
        <th style="padding:10px;text-align:center;">Qty</th>
        <th style="padding:10px;text-align:right;">Price</th>
        <th style="padding:10px;text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>${itemsListHtml(order.items)}</tbody>
  </table>
  <div style="margin-top:20px;text-align:right;">
    <p style="margin:4px 0;">Subtotal: <strong>${formatCurrency(order.items_total)}</strong></p>
    <p style="margin:4px 0;">Shipping: <strong>${Number(order.shipping_fee) === 0 ? 'FREE' : formatCurrency(order.shipping_fee)}</strong></p>
    <h2 style="margin:10px 0 0;color:#1a1a1a;">Total Payable: ${formatCurrency(order.total_amount)}</h2>
    <p style="margin:4px 0;color:#166534;font-weight:bold;">Payment Method: Cash on Delivery (COD)</p>
  </div>
`;

const sendMail = async (mailOptions) => {
  try {
    const transporter = await createTransporter();
    const info = await transporter.sendMail({ from: FROM_ADDRESS, ...mailOptions });
    if (nodemailer.getTestMessageUrl) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) console.log('Email preview URL:', previewUrl);
    }
    return { sent: true };
  } catch (err) {
    console.error('Failed to send email:', err.message);
    return { sent: false, error: err.message };
  }
};

const sendOrderConfirmationToCustomer = async (order) => {
  const body = `
    <h2 style="color:#333;margin-top:0;">Thank you for your order, ${order.customerName}!</h2>
    <p style="color:#555;">We have received your order <strong>${order.order_number}</strong> and are preparing it for delivery.</p>
    ${addressBlockHtml(order)}
    ${orderSummaryTableHtml(order)}
    <div style="margin-top:30px;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#888;text-align:center;">
      <p>This is a Cash on Delivery (COD) order. Please keep the exact amount ready upon delivery.</p>
      <p>If you have any questions, reply to this email or contact support@koorm.com.</p>
    </div>
  `;

  return sendMail({
    to: order.customerEmail,
    cc: ADMIN_EMAIL,
    subject: `Order Confirmation ${order.order_number} - KOORM Store`,
    html: emailShell('Order Confirmation (Cash on Delivery)', body),
  });
};

const sendOrderNotificationToAdmin = async (order) => {
  const body = `
    <h2 style="color:#333;margin-top:0;">🔔 New Order Received!</h2>
    <p style="color:#555;">Order <strong>${order.order_number}</strong> has been placed successfully.</p>
    ${addressBlockHtml(order)}
    ${orderSummaryTableHtml(order)}
    <div style="margin-top:30px;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#888;text-align:center;">
      <p>KOORM Admin Notification System</p>
    </div>
  `;

  return sendMail({
    to: ADMIN_EMAIL,
    subject: `🔔 New Order Received ${order.order_number} - Deliver to ${order.shipping_name}`,
    html: emailShell('Admin Order Notification', body),
  });
};

const sendOrderCancellationToAdmin = async (order) => {
  const body = `
    <h2 style="color:#333;margin-top:0;">❌ Order Cancelled</h2>
    <p style="color:#555;">Order <strong>${order.order_number}</strong> was just cancelled by the customer. Please stop any packing or shipping in progress.</p>
    <p style="color:#555;">Customer: <strong>${order.customerName}</strong> (${order.customerEmail})</p>
    ${order.items && order.items.length ? `
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <thead>
          <tr style="background-color:#f1f1f1;text-align:left;">
            <th style="padding:10px;">Item</th>
            <th style="padding:10px;text-align:center;">Qty</th>
            <th style="padding:10px;text-align:right;">Price</th>
            <th style="padding:10px;text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsListHtml(order.items)}</tbody>
      </table>` : ''}
    <p style="margin-top:12px;font-weight:bold;">Order total: ${formatCurrency(order.total_amount)}</p>
    <p style="color:#555;">Was being shipped to: ${order.shipping_name}, ${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}</p>
    <div style="margin-top:30px;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#888;text-align:center;">
      <p>KOORM Admin Notification System</p>
    </div>
  `;

  return sendMail({
    to: ADMIN_EMAIL,
    subject: `❌ Order Cancelled - ${order.order_number}`,
    html: emailShell('Order Cancellation Notice', body),
  });
};

const STATUS_MESSAGES = {
  placed: 'Your order has been placed.',
  processing: 'Your order is being prepared for shipment.',
  shipped: 'Your order is on its way!',
  delivered: 'Your order has been delivered. We hope you love it!',
  cancelled: 'Your order has been cancelled.',
};

const sendOrderStatusUpdateToCustomer = async (order) => {
  const statusMessage = STATUS_MESSAGES[order.status] || `Your order status is now: ${order.status}.`;
  const body = `
    <h2 style="color:#333;margin-top:0;">Hi ${order.customerName}, your order status has been updated</h2>
    <p style="color:#555;">Order <strong>${order.order_number}</strong></p>
    <p style="background:#f9f9f9;padding:14px 18px;border-radius:6px;font-weight:bold;text-transform:capitalize;color:#166534;">
      Status: ${order.status} — ${statusMessage}
    </p>
    ${order.items && order.items.length ? `
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <thead>
          <tr style="background-color:#f1f1f1;text-align:left;">
            <th style="padding:10px;">Item</th>
            <th style="padding:10px;text-align:center;">Qty</th>
            <th style="padding:10px;text-align:right;">Price</th>
            <th style="padding:10px;text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsListHtml(order.items)}</tbody>
      </table>` : ''}
    <p style="margin-top:12px;">Order total (Pay on Delivery): <strong>${formatCurrency(order.total_amount)}</strong></p>
    <p style="color:#555;">Shipping to: ${order.shipping_name}, ${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}</p>
    <div style="margin-top:30px;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#888;text-align:center;">
      <p>KOORM — Thoughtfully designed clothing for everyday living.</p>
    </div>
  `;

  return sendMail({
    to: order.customerEmail,
    subject: `Order Update - ${order.order_number} is now ${order.status}`,
    html: emailShell('Order Status Update', body),
  });
};

const sendWelcomeEmail = async (user) => {
  const body = `
    <h2 style="color:#333;margin-top:0;">Welcome to Koorm, ${user.name}!</h2>
    <p style="color:#555;">Your account has been created successfully with <strong>${user.email}</strong>.</p>
    <p style="color:#555;">Thoughtfully designed everyday clothing — premium fabrics, honest pricing, and Cash on Delivery on every order.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/shop"
         style="background-color:#1a1a1a;color:#ffffff;padding:12px 28px;text-decoration:none;border-radius:4px;display:inline-block;letter-spacing:1px;text-transform:uppercase;font-size:13px;">
        Start Shopping
      </a>
    </div>
    <div style="margin-top:30px;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#888;text-align:center;">
      <p>If you didn't create this account, please ignore this email or contact support@koorm.com.</p>
    </div>
  `;

  return sendMail({
    to: user.email,
    subject: 'Welcome to Koorm — Your account is ready',
    html: emailShell('Account Created', body),
  });
};

const sendVerificationCodeEmail = async (user) => {
  const body = `
    <h2 style="color:#333;margin-top:0;">Verify your email, ${user.name}</h2>
    <p style="color:#555;">Use the code below to verify <strong>${user.email}</strong> and finish setting up your Koorm account.</p>
    <div style="text-align:center;margin:28px 0;">
      <span style="display:inline-block;background-color:#f9f9f9;border:1px dashed #ccc;border-radius:6px;padding:16px 32px;font-size:32px;font-weight:bold;letter-spacing:8px;color:#1a1a1a;">
        ${user.code}
      </span>
    </div>
    <p style="color:#555;font-size:13px;text-align:center;">This code expires in 10 minutes.</p>
    <div style="margin-top:30px;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#888;text-align:center;">
      <p>If you didn't create a Koorm account, you can safely ignore this email.</p>
    </div>
  `;

  return sendMail({
    to: user.email,
    subject: `${user.code} is your Koorm verification code`,
    html: emailShell('Verify Your Email', body),
  });
};

const sendPasswordResetEmail = async (user) => {
  const body = `
    <h2 style="color:#333;margin-top:0;">Reset your password</h2>
    <p style="color:#555;">Hi ${user.name}, we received a request to reset the password for <strong>${user.email}</strong>.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${user.resetUrl}"
         style="background-color:#1a1a1a;color:#ffffff;padding:12px 28px;text-decoration:none;border-radius:4px;display:inline-block;letter-spacing:1px;text-transform:uppercase;font-size:13px;">
        Reset Password
      </a>
    </div>
    <p style="color:#555;font-size:13px;">This link expires in 1 hour. If the button doesn't work, copy and paste this URL into your browser:</p>
    <p style="color:#1a73e8;font-size:13px;word-break:break-all;">${user.resetUrl}</p>
    <div style="margin-top:30px;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#888;text-align:center;">
      <p>If you didn't request a password reset, you can safely ignore this email — your password will not change.</p>
    </div>
  `;

  return sendMail({
    to: user.email,
    subject: 'Reset your Koorm password',
    html: emailShell('Password Reset Request', body),
  });
};

module.exports = {
  sendOrderConfirmationToCustomer,
  sendOrderNotificationToAdmin,
  sendOrderCancellationToAdmin,
  sendOrderStatusUpdateToCustomer,
  sendWelcomeEmail,
  sendVerificationCodeEmail,
  sendPasswordResetEmail,
};
