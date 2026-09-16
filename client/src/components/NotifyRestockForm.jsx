import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { CheckIcon } from './Icons';

// Stands in for the add-to-bag control once a product's stock hits zero.
export default function NotifyRestockForm({ productId }) {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/products/${productId}/notify-restock`, { email: email.trim() });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'We could not save that — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="coupon-applied border-clay/40 bg-clay/10" role="status">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-cream">
          <CheckIcon width={15} height={15} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold">You're on the list</p>
          <p className="mt-0.5 text-[12px] leading-5 text-muted">We'll email you the moment this is back in stock.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="border border-sand bg-cream/60 p-4">
      <p className="text-sm font-semibold">Out of stock</p>
      <p className="mt-1 text-xs leading-5 text-muted">Leave your email and we'll let you know the moment it's back.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="notify-restock-email">Email address</label>
        <input
          id="notify-restock-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="input-field flex-1"
        />
        <button type="submit" disabled={submitting || !email.trim()} className="btn-primary shrink-0 px-5">
          {submitting ? 'Saving…' : 'Notify me'}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600" role="alert">{error}</p>}
    </form>
  );
}
