import AuthLayout from '../components/AuthLayout';
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { readPendingAdd, pendingAddPath } from '../utils/pendingCart';
import { BagIcon } from '../components/Icons';

// Back to wherever they were headed — the guarded page they were stopped at,
// or the product whose "Add to bag" sent them here in the first place.
export const postAuthRedirect = (state) => {
  const from = state?.from;
  if (from?.pathname) return `${from.pathname}${from.search || ''}`;
  return pendingAddPath() || '/';
};

export default function Login() {
  const { requestLoginCode, verifyLoginCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pendingAdd = readPendingAdd();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const data = await requestLoginCode(email);
      setMessage(data.message);
      setCodeSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send login code');
      if (err.response?.data?.unverified) {
        navigate('/verify-email', { state: { email } });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyLoginCode(email, code);
      navigate(postAuthRedirect(location.state), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="section-title mb-2 text-center">Welcome Back</h1>
      <p className="text-center text-muted mb-8 text-sm">
        {codeSent ? 'Enter the code we emailed you to continue' : 'Login with a code sent to your email'}
      </p>

      {pendingAdd && (
        <div className="coupon-applied mb-6 border-clay/40 bg-clay/10">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-cream"><BagIcon width={15} height={15} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold">Your pick is waiting</p>
            <p className="mt-0.5 text-[12px] leading-5 text-muted">Sign in and we will drop size {pendingAdd.size} straight into your bag.</p>
          </div>
        </div>
      )}

      {!codeSent ? (
        <form onSubmit={handleRequestCode} className="space-y-4">
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
            {loading ? 'Sending code...' : 'Send Login Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <input
            required
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="input-field text-center tracking-[0.4em] text-lg"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {message && <p className="text-green-700 text-sm">{message}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <button
            type="button"
            onClick={() => {
              setCodeSent(false);
              setCode('');
              setError('');
              setMessage('');
            }}
            className="w-full text-sm text-accent font-medium hover:underline"
          >
            Use a different email
          </button>
        </form>
      )}

      <p className="text-center text-sm text-muted mt-6">
        New to Koorm? <Link to="/register" state={location.state} className="text-accent font-medium">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
