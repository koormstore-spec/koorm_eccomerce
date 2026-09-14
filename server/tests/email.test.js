const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
  getTestMessageUrl: undefined,
}));

const {
  sendOrderConfirmationToCustomer,
  sendOrderNotificationToAdmin,
  sendOrderCancellationToAdmin,
  sendOrderStatusUpdateToCustomer,
  sendWelcomeEmail,
  sendVerificationCodeEmail,
} = require('../utils/email');

const sampleOrder = {
  customerEmail: 'jane@example.com',
  customerName: 'Jane',
  order_number: 'KRM123456',
  items: [{ product_name: 'Linen Shirt', size: 'M', quantity: 1, price: 1899 }],
  items_total: 1899,
  shipping_fee: 0,
  total_amount: 1899,
  shipping_name: 'Jane',
  shipping_phone: '9998887777',
  shipping_address_line1: '1 Main St',
  shipping_city: 'Pune',
  shipping_state: 'Maharashtra',
  shipping_pincode: '411001',
};

describe('sendOrderConfirmationToCustomer', () => {
  it('emails the customer, cc-ing the admin, with the order number in the subject', async () => {
    await sendOrderConfirmationToCustomer(sampleOrder);

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const mail = mockSendMail.mock.calls[0][0];
    expect(mail.to).toBe('jane@example.com');
    expect(mail.cc).toBe(process.env.ADMIN_EMAIL);
    expect(mail.subject).toContain('KRM123456');
    expect(mail.html).toContain('Jane');
    expect(mail.html).toContain('Linen Shirt');
  });
});

describe('sendOrderNotificationToAdmin', () => {
  it('emails the admin about the new order', async () => {
    await sendOrderNotificationToAdmin(sampleOrder);

    const mail = mockSendMail.mock.calls[0][0];
    expect(mail.to).toBe(process.env.ADMIN_EMAIL);
    expect(mail.subject).toContain('KRM123456');
    expect(mail.subject).toContain(sampleOrder.shipping_name);
  });
});

describe('sendOrderCancellationToAdmin', () => {
  it('emails the admin that the order was cancelled', async () => {
    await sendOrderCancellationToAdmin(sampleOrder);

    const mail = mockSendMail.mock.calls[0][0];
    expect(mail.to).toBe(process.env.ADMIN_EMAIL);
    expect(mail.subject).toContain('Cancelled');
    expect(mail.subject).toContain('KRM123456');
    expect(mail.html).toContain('cancelled by the customer');
  });
});

describe('sendOrderStatusUpdateToCustomer', () => {
  it('emails the customer with the new status in the subject and body', async () => {
    await sendOrderStatusUpdateToCustomer({ ...sampleOrder, status: 'shipped' });

    const mail = mockSendMail.mock.calls[0][0];
    expect(mail.to).toBe('jane@example.com');
    expect(mail.subject).toContain('shipped');
    expect(mail.html).toContain('on its way');
  });

  it('renders without an items table when items are not supplied', async () => {
    await sendOrderStatusUpdateToCustomer({ ...sampleOrder, items: undefined, status: 'delivered' });

    const mail = mockSendMail.mock.calls[0][0];
    expect(mail.html).not.toContain('<table');
  });
});

describe('sendWelcomeEmail', () => {
  it('emails the new user with a link back to the shop', async () => {
    await sendWelcomeEmail({ name: 'Jane', email: 'jane@example.com' });

    const mail = mockSendMail.mock.calls[0][0];
    expect(mail.to).toBe('jane@example.com');
    expect(mail.subject).toContain('Welcome');
    expect(mail.html).toContain('/shop');
  });
});

describe('sendVerificationCodeEmail', () => {
  it('emails the code to the user, with the code visible in both subject and body', async () => {
    await sendVerificationCodeEmail({ name: 'Jane', email: 'jane@example.com', code: '482913' });

    const mail = mockSendMail.mock.calls[0][0];
    expect(mail.to).toBe('jane@example.com');
    expect(mail.subject).toContain('482913');
    expect(mail.html).toContain('482913');
    expect(mail.html).toContain('10 minutes');
  });
});
