jest.mock('../config/db', () => ({
  pool: { query: jest.fn() },
}));
jest.mock('../utils/email', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue({ sent: true }),
  sendVerificationCodeEmail: jest.fn().mockResolvedValue({ sent: true }),
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ sent: true }),
}));
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}));

const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { sendWelcomeEmail, sendVerificationCodeEmail, sendPasswordResetEmail } = require('../utils/email');
const {
  register,
  login,
  verifyEmail,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('register', () => {
  it('rejects when required fields are missing', async () => {
    const req = { body: { email: 'a@b.com' } };
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('rejects when the email is already registered', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1 }]]);
    const req = { body: { name: 'Jane', email: 'jane@example.com', password: 'secret123' } };
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'An account with this email already exists' });
  });

  it('creates the user, returns a token, and fires both the welcome and verification emails', async () => {
    pool.query
      .mockResolvedValueOnce([[]]) // no existing user
      .mockResolvedValueOnce([{ insertId: 10 }]) // insert result
      .mockResolvedValueOnce([{}]); // UPDATE users SET verification_code...
    const req = { body: { name: 'Jane', email: 'jane@example.com', password: 'secret123', phone: '9998887777' } };
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const payload = res.json.mock.calls[0][0];
    expect(payload).toMatchObject({
      id: 10,
      name: 'Jane',
      email: 'jane@example.com',
      phone: '9998887777',
      is_verified: false,
    });
    expect(payload.token).toEqual(expect.any(String));

    expect(sendWelcomeEmail).toHaveBeenCalledWith({ name: 'Jane', email: 'jane@example.com' });
    expect(sendVerificationCodeEmail).toHaveBeenCalledTimes(1);
    const verificationArg = sendVerificationCodeEmail.mock.calls[0][0];
    expect(verificationArg.email).toBe('jane@example.com');
    expect(verificationArg.code).toMatch(/^\d{6}$/);
  });
});

describe('verifyEmail', () => {
  it('rejects when email or code is missing', async () => {
    const req = { body: { email: 'jane@example.com' } };
    const res = mockRes();

    await verifyEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('rejects an invalid or expired code', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    const req = { body: { email: 'jane@example.com', code: '000000' } };
    const res = mockRes();

    await verifyEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired verification code' });
  });

  it('rejects re-verifying an already-verified account', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, is_verified: 1 }]]);
    const req = { body: { email: 'jane@example.com', code: '123456' } };
    const res = mockRes();

    await verifyEmail(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'This account is already verified' });
  });

  it('marks the account verified and clears the code on a matching, unexpired code', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 1, is_verified: 0 }]]) // code lookup
      .mockResolvedValueOnce([{}]); // UPDATE is_verified = 1
    const req = { body: { email: 'jane@example.com', code: '123456' } };
    const res = mockRes();

    await verifyEmail(req, res);

    expect(res.json).toHaveBeenCalledWith({ message: 'Email verified successfully.', verified: true });
    const updateCall = pool.query.mock.calls[1];
    expect(updateCall[0]).toContain('is_verified = 1');
    expect(updateCall[1]).toEqual([1]);
  });
});

describe('resendVerificationCode', () => {
  it('returns 404 for an email with no account', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    const req = { body: { email: 'nobody@example.com' } };
    const res = mockRes();

    await resendVerificationCode(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('refuses to resend a code for an already-verified account', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, name: 'Jane', is_verified: 1 }]]);
    const req = { body: { email: 'jane@example.com' } };
    const res = mockRes();

    await resendVerificationCode(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'This account is already verified' });
    expect(sendVerificationCodeEmail).not.toHaveBeenCalled();
  });

  it('issues a fresh code and emails it for an unverified account', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 1, name: 'Jane', is_verified: 0 }]])
      .mockResolvedValueOnce([{}]); // UPDATE verification_code
    const req = { body: { email: 'jane@example.com' } };
    const res = mockRes();

    await resendVerificationCode(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: 'A new verification code has been sent to your email.',
    });
    expect(sendVerificationCodeEmail).toHaveBeenCalledTimes(1);
    const arg = sendVerificationCodeEmail.mock.calls[0][0];
    expect(arg.email).toBe('jane@example.com');
    expect(arg.code).toMatch(/^\d{6}$/);
  });
});

describe('login', () => {
  it('rejects an unknown email', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    const req = { body: { email: 'nobody@example.com', password: 'whatever' } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
  });

  it('rejects an incorrect password without revealing which part was wrong', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1, password: 'hashed-password' }]]);
    bcrypt.compare.mockResolvedValueOnce(false);
    const req = { body: { email: 'jane@example.com', password: 'wrong' } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
  });

  it('returns a token on valid credentials', async () => {
    const user = { id: 1, name: 'Jane', email: 'jane@example.com', phone: '999', password: 'hashed-password' };
    pool.query.mockResolvedValueOnce([[user]]);
    bcrypt.compare.mockResolvedValueOnce(true);
    const req = { body: { email: 'jane@example.com', password: 'secret123' } };
    const res = mockRes();

    await login(req, res);

    expect(res.status).not.toHaveBeenCalledWith(401);
    const payload = res.json.mock.calls[0][0];
    expect(payload.id).toBe(1);
    expect(payload.token).toEqual(expect.any(String));
    expect(payload.password).toBeUndefined();
  });
});

describe('forgotPassword', () => {
  it('returns the generic message and sends no email for an unknown address (no user enumeration)', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    const req = { body: { email: 'nobody@example.com' } };
    const res = mockRes();

    await forgotPassword(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('returns the same generic message and sends a reset email for a known address', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 1, name: 'Jane', email: 'jane@example.com' }]])
      .mockResolvedValueOnce([{}]); // UPDATE users SET reset_token...
    const req = { body: { email: 'jane@example.com' } };
    const res = mockRes();

    await forgotPassword(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    const emailArg = sendPasswordResetEmail.mock.calls[0][0];
    expect(emailArg.email).toBe('jane@example.com');
    expect(emailArg.resetUrl).toContain('/reset-password/');
  });
});

describe('resetPassword', () => {
  it('rejects a password shorter than 6 characters', async () => {
    const req = { params: { token: 'abc' }, body: { password: '123' } };
    const res = mockRes();

    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('rejects an invalid or expired token', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    const req = { params: { token: 'bad-token' }, body: { password: 'newpassword1' } };
    const res = mockRes();

    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'This reset link is invalid or has expired' });
  });

  it('updates the password and clears the reset token for a valid token', async () => {
    pool.query
      .mockResolvedValueOnce([[{ id: 1 }]]) // token lookup
      .mockResolvedValueOnce([{}]); // UPDATE password
    const req = { params: { token: 'good-token' }, body: { password: 'newpassword1' } };
    const res = mockRes();

    await resetPassword(req, res);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Password has been reset successfully. You can now log in.',
    });
    const updateCall = pool.query.mock.calls[1];
    expect(updateCall[0]).toContain('reset_token = NULL');
    expect(updateCall[1]).toEqual(['hashed-password', 1]);
  });
});
