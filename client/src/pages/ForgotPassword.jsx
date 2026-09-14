import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-x py-20 max-w-md mx-auto fade-in">
      <h1 className="section-title mb-2 text-center">Forgot Password</h1>
      <p className="text-center text-muted mb-8 text-sm">
        Enter your email and we'll send you a link to reset your password.
      </p>

      {submitted ? (
        <div className="border border-sand p-6 text-center">
          <p className="text-muted mb-4">{message}</p>
          <Link to="/login" className="text-accent font-medium text-sm">Back to Login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}

      <p className="text-center text-sm text-muted mt-6">
        Remembered your password? <Link to="/login" className="text-accent font-medium">Login</Link>
      </p>
    </div>
  );
}
