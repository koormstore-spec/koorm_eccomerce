import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { TicketIcon, CheckIcon, CloseIcon } from './Icons';

// The single coupon surface, shared by the bag and checkout summaries so the
// code a shopper enters in one is already applied in the other.
export default function CouponBox({ heading = 'Have a coupon?' }) {
  const { appliedCoupon, couponError, couponLoading, applyCoupon, removeCoupon, cartDiscount } = useCart();
  const [code, setCode] = useState('');

  useEffect(() => {
    if (appliedCoupon) setCode('');
  }, [appliedCoupon]);

  const submit = (event) => {
    event.preventDefault();
    if (!code.trim() || couponLoading) return;
    applyCoupon(code);
  };

  if (appliedCoupon) {
    return (
      <div className="coupon-applied" role="status">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-clay text-white">
          <CheckIcon width={15} height={15} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold tracking-[0.08em]">{appliedCoupon.code} applied</p>
          <p className="mt-0.5 text-[12px] text-cream/60">
            You saved &#8377;{cartDiscount.toLocaleString('en-IN')} on this order.
          </p>
        </div>
        <button
          type="button"
          onClick={removeCoupon}
          className="btn-icon h-8 w-8 shrink-0 text-cream/60 hover:bg-cream/10 hover:text-cream"
          aria-label={`Remove coupon ${appliedCoupon.code}`}
        >
          <CloseIcon width={15} height={15} />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="fade-in-soft">
      <p className="mb-2.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-cream/60">
        <TicketIcon width={15} height={15} className="text-accent" aria-hidden="true" />
        {heading}
      </p>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="coupon-code">Coupon code</label>
        <input
          id="coupon-code"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="Enter code"
          autoComplete="off"
          spellCheck="false"
          className="input-field h-11 flex-1 border-cream/20 bg-white/5 tracking-[0.12em] text-cream placeholder:tracking-normal placeholder:text-cream/40 focus:border-clay focus:ring-clay/20"
        />
        <button
          type="submit"
          disabled={couponLoading || !code.trim()}
          className="shrink-0 rounded-sm border border-cream/25 px-4 text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors duration-200 hover:bg-cream/10 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {couponLoading ? 'Checking' : 'Apply'}
        </button>
      </div>
      {couponError && (
        <p className="mt-2 text-[12px] leading-5 text-red-300 fade-in-soft" role="alert">
          {couponError}
        </p>
      )}
    </form>
  );
}
