import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { BagIcon, CashIcon, CheckShieldIcon } from '../components/Icons';

const Progress = () => (
  <div className="mb-9 flex items-center gap-2 overflow-hidden sm:gap-4"><span className="progress-step progress-step-active"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[9px] text-white">1</span> Bag</span><span className="h-px flex-1 bg-ink" /><span className="progress-step progress-step-active"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[9px] text-white">2</span> Details</span><span className="h-px flex-1 bg-sand" /><span className="progress-step"><span className="flex h-5 w-5 items-center justify-center rounded-full border border-sand">3</span> Confirm</span></div>
);

export default function Checkout() {
  const { cartItems, cartTotal, refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ shipping_name: user?.name || '', shipping_phone: user?.phone || '', shipping_address_line1: '', shipping_address_line2: '', shipping_city: '', shipping_state: '', shipping_pincode: '' });
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const shippingFee = cartTotal >= 1999 ? 0 : 99;
  const discountAmount = appliedCoupon?.discount_amount || 0;
  const orderTotal = cartTotal - discountAmount + shippingFee;

  // The applied discount was computed against the bag as it stood at that
  // moment — if the bag changes, it needs re-checking against the new total.
  useEffect(() => {
    if (appliedCoupon) {
      setAppliedCoupon(null);
      setCouponError('Your bag changed — please re-apply your coupon.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartTotal]);

  if (cartItems.length === 0) return <div className="container-x py-24 text-center"><p className="page-kicker justify-center">Checkout</p><h1 className="section-title">Your bag is empty.</h1><p className="mt-3 text-sm text-muted">Add a piece before continuing to checkout.</p><Link to="/shop" className="btn-primary mt-7">Explore the collection</Link></div>;

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const applyCoupon = async (event) => {
    event.preventDefault();
    if (!couponCode.trim()) return;
    setCouponError(''); setApplyingCoupon(true);
    try {
      const { data } = await api.post('/coupons/validate', { code: couponCode.trim() });
      setAppliedCoupon(data);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.message || 'Could not apply this coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    setError(''); setPlacing(true);
    try {
      const { data } = await api.post('/orders', { ...form, coupon_code: appliedCoupon?.code });
      await refreshCart();
      navigate(`/orders/${data.id}`, { state: { justPlaced: true } });
    }
    catch (err) { setError(err.response?.data?.message || 'We could not place your order. Please try again.'); }
    finally { setPlacing(false); }
  };

  return (
    <div className="container-x py-8 fade-in md:py-12">
      <Progress />
      <div className="mb-8"><p className="page-kicker">Almost there</p><h1 className="section-title">Delivery details</h1><p className="mt-3 text-sm text-muted">Tell us where you would like your Koorm order delivered.</p></div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] xl:gap-12">
        <form onSubmit={placeOrder} className="panel p-5 sm:p-7 md:p-8"><div className="mb-7 flex items-start justify-between border-b border-sand pb-5"><div><h2 className="font-serif text-2xl">Shipping address</h2><p className="mt-1 text-xs leading-5 text-muted">We will only use these details to deliver this order.</p></div><CheckShieldIcon width={21} height={21} className="text-accent" /></div>
          <div className="grid gap-5 sm:grid-cols-2"><label className="block text-xs font-semibold text-ink/75 sm:col-span-2">Full name<input name="shipping_name" value={form.shipping_name} onChange={handleChange} required placeholder="Your full name" className="input-field mt-2" /></label><label className="block text-xs font-semibold text-ink/75 sm:col-span-2">Phone number<input name="shipping_phone" value={form.shipping_phone} onChange={handleChange} required placeholder="10-digit mobile number" className="input-field mt-2" /></label><label className="block text-xs font-semibold text-ink/75 sm:col-span-2">Address line 1<input name="shipping_address_line1" value={form.shipping_address_line1} onChange={handleChange} required placeholder="House no., building, street" className="input-field mt-2" /></label><label className="block text-xs font-semibold text-ink/75 sm:col-span-2">Address line 2 <span className="font-normal text-muted">(optional)</span><input name="shipping_address_line2" value={form.shipping_address_line2} onChange={handleChange} placeholder="Landmark, area, etc." className="input-field mt-2" /></label><label className="block text-xs font-semibold text-ink/75">City<input name="shipping_city" value={form.shipping_city} onChange={handleChange} required placeholder="City" className="input-field mt-2" /></label><label className="block text-xs font-semibold text-ink/75">State<input name="shipping_state" value={form.shipping_state} onChange={handleChange} required placeholder="State" className="input-field mt-2" /></label><label className="block text-xs font-semibold text-ink/75 sm:col-span-2">Pincode<input name="shipping_pincode" value={form.shipping_pincode} onChange={handleChange} required placeholder="6-digit pincode" className="input-field mt-2 sm:max-w-[48%]" /></label></div>
          <div className="mt-7 flex gap-3 border border-clay/25 bg-clay/5 p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-accent"><CashIcon width={18} height={18} /></span><div><p className="text-sm font-semibold">Cash on delivery</p><p className="mt-1 text-xs leading-5 text-muted">Pay for your order when it reaches you. No payment is required today.</p></div></div>
          {error && <p className="mt-5 text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={placing} className="btn-primary mt-7 w-full">{placing ? 'Placing your order...' : 'Place secure order'} <span aria-hidden="true">&rarr;</span></button>
        </form>
        <aside className="h-fit bg-ink p-6 text-cream lg:sticky lg:top-32">
          <div className="flex items-center justify-between border-b border-cream/15 pb-4"><h2 className="font-serif text-2xl">Your order</h2><BagIcon width={19} height={19} className="text-accent" /></div>
          <div className="max-h-72 divide-y divide-cream/10 overflow-y-auto py-2">{cartItems.map((item) => <div key={item.id} className="flex gap-3 py-3"><img src={item.images?.[0]} alt="" className="h-14 w-11 object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{item.name}</p><p className="mt-1 text-[12px] text-cream/55">{item.size} &middot; Qty {item.quantity}</p></div><p className="shrink-0 text-xs">&#8377;{(Number(item.discount_price || item.price) * item.quantity).toLocaleString('en-IN')}</p></div>)}</div>

          <div className="border-t border-cream/15 py-4">
            {appliedCoupon ? (
              <div className="flex items-center justify-between gap-3 bg-cream/10 px-3 py-2.5 text-xs">
                <span>Coupon <strong className="tracking-wide">{appliedCoupon.code}</strong> applied</span>
                <button type="button" onClick={removeCoupon} className="font-semibold text-accent hover:underline">Remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                  placeholder="Coupon code"
                  className="input-field h-11 flex-1 border-cream/20 bg-white/5 text-cream placeholder:text-cream/40"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={applyingCoupon || !couponCode.trim()}
                  className="shrink-0 border border-cream/25 px-4 text-xs font-semibold uppercase tracking-wide hover:bg-cream/10 disabled:opacity-50"
                >
                  {applyingCoupon ? 'Checking...' : 'Apply'}
                </button>
              </div>
            )}
            {couponError && <p className="mt-2 text-xs text-red-300">{couponError}</p>}
          </div>

          <div className="space-y-3 border-t border-cream/15 py-5 text-sm">
            <div className="flex justify-between text-cream/70"><span>Subtotal</span><span className="text-cream">&#8377;{cartTotal.toLocaleString('en-IN')}</span></div>
            {discountAmount > 0 && <div className="flex justify-between text-green-400"><span>Coupon discount</span><span>&minus;&#8377;{discountAmount.toLocaleString('en-IN')}</span></div>}
            <div className="flex justify-between text-cream/70"><span>Delivery</span><span className="text-cream">{shippingFee === 0 ? 'Complimentary' : `₹${shippingFee}`}</span></div>
          </div>
          <div className="flex justify-between border-t border-cream/15 pt-5 text-lg font-semibold"><span>Total</span><span>&#8377;{orderTotal.toLocaleString('en-IN')}</span></div>
          <p className="mt-5 text-center text-[12px] leading-5 text-cream/55">Review your order, then place it securely with cash on delivery.</p>
        </aside>
      </div>
    </div>
  );
}
