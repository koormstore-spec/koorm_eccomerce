import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CouponBox from '../components/CouponBox';
import { BagIcon, CashIcon, CheckShieldIcon, CheckIcon, MapPinIcon } from '../components/Icons';

const PINCODE_LENGTH = 6;
const PHONE_LENGTH = 10;

const Progress = () => (
  <div className="mb-9 flex items-center gap-2 overflow-hidden sm:gap-4"><span className="progress-step progress-step-active"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[9px] text-white">1</span> Bag</span><span className="h-px flex-1 bg-ink" /><span className="progress-step progress-step-active"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[9px] text-white">2</span> Details</span><span className="h-px flex-1 bg-sand" /><span className="progress-step"><span className="flex h-5 w-5 items-center justify-center rounded-full border border-sand">3</span> Confirm</span></div>
);

const FieldGroup = ({ title, children }) => (
  <div className="mb-6"><p className="mb-4 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">{title}</p><div className="grid gap-5 sm:grid-cols-2">{children}</div></div>
);

export default function Checkout() {
  // Coupon state lives in the cart context, so a code entered in the bag is
  // already applied here — and re-priced by the server whenever the bag moves.
  const { cartItems, cartTotal, cartDiscount, shippingFee, cartPayable, appliedCoupon, refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ shipping_name: user?.name || '', shipping_phone: user?.phone || '', shipping_address_line1: '', shipping_address_line2: '', shipping_city: '', shipping_state: '', shipping_pincode: '' });
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  // Pincode → city/state lookup (India Post's public PIN code directory).
  const [pincodeStatus, setPincodeStatus] = useState('idle'); // idle | loading | found | not-found | error
  const [flashFields, setFlashFields] = useState([]);
  const flashTimerRef = useRef(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'shipping_phone') {
      return setForm((f) => ({ ...f, shipping_phone: value.replace(/\D/g, '').slice(0, PHONE_LENGTH) }));
    }
    if (name === 'shipping_pincode') {
      const digits = value.replace(/\D/g, '').slice(0, PINCODE_LENGTH);
      setForm((f) => ({ ...f, shipping_pincode: digits }));
      if (digits.length < PINCODE_LENGTH) setPincodeStatus('idle');
      return;
    }
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Fires once the pincode reaches 6 digits; a fresh 6-digit value cancels
  // whatever lookup was already in flight.
  useEffect(() => {
    const pincode = form.shipping_pincode;
    if (pincode.length !== PINCODE_LENGTH) return;

    const controller = new AbortController();
    setPincodeStatus('loading');

    fetch(`https://api.postalpincode.in/pincode/${pincode}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        const postOffice = data?.[0]?.PostOffice?.[0];
        if (data?.[0]?.Status !== 'Success' || !postOffice) {
          setPincodeStatus('not-found');
          return;
        }
        setForm((f) => ({ ...f, shipping_city: postOffice.District, shipping_state: postOffice.State }));
        setPincodeStatus('found');
        setFlashFields(['shipping_city', 'shipping_state']);
        clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => setFlashFields([]), 1100);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setPincodeStatus('error');
      });

    return () => controller.abort();
  }, [form.shipping_pincode]);

  useEffect(() => () => clearTimeout(flashTimerRef.current), []);

  if (cartItems.length === 0) return <div className="container-x py-24 text-center"><p className="page-kicker justify-center">Checkout</p><h1 className="section-title">Your bag is empty.</h1><p className="mt-3 text-sm text-muted">Add a piece before continuing to checkout.</p><Link to="/shop" className="btn-primary mt-7">Explore the collection</Link></div>;

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
    <div className="container-x py-8 md:py-12">
      <Progress />
      <div className="mb-8"><p className="page-kicker">Almost there</p><h1 className="section-title">Delivery details</h1><p className="mt-3 text-sm text-muted">Tell us where you would like your Koorm order delivered.</p></div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] xl:gap-12">
        <form onSubmit={placeOrder} className="panel p-5 sm:p-7 md:p-8">
          <div className="mb-7 flex items-start justify-between border-b border-sand pb-5"><div><h2 className="font-serif text-2xl">Shipping address</h2><p className="mt-1 text-xs leading-5 text-muted">We will only use these details to deliver this order.</p></div><CheckShieldIcon width={21} height={21} className="text-accent" /></div>

          <FieldGroup title="Contact details">
            <label className="block text-xs font-semibold text-ink/75 sm:col-span-2">Full name<input name="shipping_name" value={form.shipping_name} onChange={handleChange} required placeholder="Your full name" className="input-field mt-2" /></label>
            <label className="block text-xs font-semibold text-ink/75 sm:col-span-2">Phone number<input name="shipping_phone" value={form.shipping_phone} onChange={handleChange} required inputMode="numeric" pattern="[6-9]\d{9}" title="Enter a valid 10-digit mobile number" placeholder="10-digit mobile number" className="input-field mt-2" /></label>
          </FieldGroup>

          <FieldGroup title="Delivery address">
            <label className="block text-xs font-semibold text-ink/75 sm:col-span-2">Address line 1<input name="shipping_address_line1" value={form.shipping_address_line1} onChange={handleChange} required placeholder="House no., building, street" className="input-field mt-2" /></label>
            <label className="block text-xs font-semibold text-ink/75 sm:col-span-2">Address line 2 <span className="font-normal text-muted">(optional)</span><input name="shipping_address_line2" value={form.shipping_address_line2} onChange={handleChange} placeholder="Landmark, area, etc." className="input-field mt-2" /></label>

            <label className="block text-xs font-semibold text-ink/75 sm:col-span-2">
              Pincode
              <div className="relative mt-2 sm:max-w-[48%]">
                <input name="shipping_pincode" value={form.shipping_pincode} onChange={handleChange} required inputMode="numeric" pattern="\d{6}" title="Enter a 6-digit pincode" placeholder="6-digit pincode" className="input-field pr-9" />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  {pincodeStatus === 'loading' && <span className="block h-4 w-4 rounded-full border-2 border-accent border-t-transparent animate-spin" aria-hidden="true" />}
                  {pincodeStatus === 'found' && <CheckIcon width={16} height={16} className="text-accent" aria-hidden="true" />}
                  {(pincodeStatus === 'not-found' || pincodeStatus === 'error') && <MapPinIcon width={16} height={16} className="text-muted" aria-hidden="true" />}
                </span>
              </div>
              {pincodeStatus === 'found' && <p className="fade-in-soft mt-1.5 text-[11px] font-medium text-accent" role="status">City and state filled in for you — check they're right.</p>}
              {pincodeStatus === 'not-found' && <p className="fade-in-soft mt-1.5 text-[11px] text-muted" role="status">We couldn&rsquo;t find that pincode — please fill in city and state yourself.</p>}
              {pincodeStatus === 'error' && <p className="fade-in-soft mt-1.5 text-[11px] text-muted" role="status">Couldn&rsquo;t look that up right now — please fill in city and state yourself.</p>}
            </label>

            <label className="block text-xs font-semibold text-ink/75">City<input name="shipping_city" value={form.shipping_city} onChange={handleChange} required placeholder="City" className={`input-field mt-2 ${flashFields.includes('shipping_city') ? 'field-flash' : ''}`} /></label>
            <label className="block text-xs font-semibold text-ink/75">State<input name="shipping_state" value={form.shipping_state} onChange={handleChange} required placeholder="State" className={`input-field mt-2 ${flashFields.includes('shipping_state') ? 'field-flash' : ''}`} /></label>
          </FieldGroup>

          <div className="flex gap-3 border border-clay/25 bg-clay/5 p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-accent"><CashIcon width={18} height={18} /></span><div><p className="text-sm font-semibold">Cash on delivery</p><p className="mt-1 text-xs leading-5 text-muted">Pay for your order when it reaches you. No payment is required today.</p></div></div>
          {error && <p className="fade-in-soft mt-5 text-sm text-red-600" role="alert">{error}</p>}
          <button type="submit" disabled={placing} className="btn-primary mt-7 w-full">{placing ? 'Placing your order...' : 'Place secure order'} <span aria-hidden="true">&rarr;</span></button>
        </form>
        <aside className="h-fit bg-ink p-6 text-cream lg:sticky lg:top-32">
          <div className="flex items-center justify-between border-b border-cream/15 pb-4"><h2 className="font-serif text-2xl">Your order</h2><BagIcon width={19} height={19} className="text-accent" /></div>
          <div className="max-h-72 divide-y divide-cream/10 overflow-y-auto py-2">{cartItems.map((item) => <div key={item.id} className="flex gap-3 py-3"><img src={item.images?.[0]} alt="" className="h-14 w-11 object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{item.name}</p><p className="mt-1 text-[12px] text-cream/55">{item.size} &middot; Qty {item.quantity}</p></div><p className="shrink-0 text-xs">&#8377;{(Number(item.discount_price || item.price) * item.quantity).toLocaleString('en-IN')}</p></div>)}</div>

          <div className="border-t border-cream/15 py-5"><CouponBox /></div>

          <div className="space-y-3 border-t border-cream/15 py-5 text-sm">
            <div className="flex justify-between text-cream/70"><span>Subtotal</span><span key={cartTotal} className="value-flip text-cream">&#8377;{cartTotal.toLocaleString('en-IN')}</span></div>
            {cartDiscount > 0 && <div className="fade-in-soft flex justify-between text-clay"><span>Coupon {appliedCoupon?.code}</span><span key={cartDiscount} className="value-flip">&minus;&#8377;{cartDiscount.toLocaleString('en-IN')}</span></div>}
            <div className="flex justify-between text-cream/70"><span>Delivery</span><span className="text-cream">{shippingFee === 0 ? 'Complimentary' : `₹${shippingFee}`}</span></div>
          </div>
          <div className="flex justify-between border-t border-cream/15 pt-5 text-lg font-semibold"><span>Total</span><span key={cartPayable} className="value-flip">&#8377;{cartPayable.toLocaleString('en-IN')}</span></div>
          <p className="mt-5 text-center text-[12px] leading-5 text-cream/55">Review your order, then place it securely with cash on delivery.</p>
        </aside>
      </div>
    </div>
  );
}
