import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { CheckShieldIcon, ChevronRightIcon } from '../../components/Icons';
import { AdminIcon, AdminNotice } from '../../components/admin/AdminUI';

export default function AdminLogin() {
  const { adminLogin } = useAdminAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async event => {
    event.preventDefault(); setError(''); setLoading(true);
    try { await adminLogin(form.email, form.password); navigate('/admin'); }
    catch (err) { setError(err.response?.data?.message || 'Login failed. Please check your details and try again.'); }
    finally { setLoading(false); }
  };
  return <div className="admin-login">
    <section className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-cream lg:flex xl:p-16"><Link to="/" className="relative z-10 w-fit font-serif text-4xl font-semibold tracking-[-0.06em]">KOORM</Link><div className="relative z-10 my-16 max-w-md"><p className="mb-6 text-[10px] uppercase tracking-[0.2em] text-[#c4d1b6]">Behind every great collection</p><h2 className="font-serif text-5xl leading-[1.12] tracking-[-0.04em] xl:text-6xl">A little care.<br /><em className="font-normal text-[#c4d1b6]">A great store.</em></h2><p className="mt-7 max-w-sm text-sm leading-7 text-cream/60">Your collection, your customers, and your next chapter. Bring it all together in your Koorm workspace.</p><div className="mt-10 space-y-5">{[{ icon: 'products', text: 'Build a collection worth coming back to' }, { icon: 'orders', text: 'Keep every customer order moving' }, { icon: 'dashboard', text: 'See the bigger picture, at a glance' }].map(item => <div key={item.icon} className="flex items-center gap-3 text-xs text-cream/80"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10"><AdminIcon type={item.icon} width={17} height={17} /></span>{item.text}</div>)}</div></div><p className="relative z-10 text-[10px] tracking-wide text-cream/40">KOORM · Your everyday, considered.</p><div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full border border-white/10" /><div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full border border-white/10" /></section>
    <section className="flex min-w-0 flex-col justify-center px-5 py-10 sm:px-12"><div className="mx-auto w-full max-w-sm"><Link to="/" className="mb-12 inline-block font-serif text-3xl font-semibold tracking-[-0.06em] lg:hidden">KOORM</Link><span className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-sand bg-white text-accent"><CheckShieldIcon width={24} height={24} /></span><p className="eyebrow mb-3">Your admin workspace</p><h1 className="font-serif text-4xl font-semibold tracking-[-0.035em]">Welcome back.</h1><p className="mb-8 mt-3 text-sm leading-6 text-muted">Sign in to take care of your store.</p><form onSubmit={handleSubmit} className="space-y-5"><label className="admin-field">Admin email<input type="email" autoComplete="username" required value={form.email} onChange={event => setForm(value => ({ ...value, email: event.target.value }))} placeholder="you@example.com" className="input-field" /></label><label className="admin-field">Password<span className="relative block"><input aria-label="Password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={form.password} onChange={event => setForm(value => ({ ...value, password: event.target.value }))} placeholder="Enter your password" className="input-field pr-16" /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-1 top-2 h-11 px-3 text-xs font-medium text-accent">{showPassword ? 'Hide' : 'Show'}</button></span></label>{error && <AdminNotice>{error}</AdminNotice>}<button type="submit" disabled={loading} className="admin-primary w-full">{loading ? 'Signing in…' : 'Sign in to workspace'}<ChevronRightIcon width={15} height={15} /></button></form><p className="mt-6 text-center text-[11px] text-muted">Authorised Koorm staff only.</p><div className="mt-8 border-t border-sand pt-6"><Link to="/" className="inline-flex min-h-11 items-center gap-2 text-xs text-muted hover:text-ink"><ChevronRightIcon width={14} height={14} className="rotate-180" />Back to the storefront</Link></div></div></section>
  </div>;
}

