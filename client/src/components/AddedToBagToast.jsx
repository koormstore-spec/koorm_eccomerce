import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { CheckIcon, CloseIcon } from './Icons';

const VISIBLE_MS = 3800;
const EXIT_MS = 260;

// Confirms an add from anywhere in the app. Slides in on transform/opacity
// only, and leaves the page layout untouched so nothing reflows behind it.
export default function AddedToBagToast() {
  const { lastAdded, dismissLastAdded, cartCount } = useCart();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!lastAdded) return;
    setLeaving(false);
    const hide = setTimeout(() => setLeaving(true), VISIBLE_MS);
    const clear = setTimeout(dismissLastAdded, VISIBLE_MS + EXIT_MS);
    return () => {
      clearTimeout(hide);
      clearTimeout(clear);
    };
  }, [lastAdded, dismissLastAdded]);

  if (!lastAdded) return null;

  const close = () => {
    setLeaving(true);
    setTimeout(dismissLastAdded, EXIT_MS);
  };

  return createPortal(
    <div className="toast-layer" role="status" aria-live="polite">
      <div key={lastAdded.at} className={`toast-card ${leaving ? 'toast-card-leaving' : ''}`}>
        <span className="toast-check" aria-hidden="true">
          <CheckIcon width={14} height={14} />
        </span>
        {lastAdded.image && (
          <img src={lastAdded.image} alt="" className="h-16 w-12 shrink-0 object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-accent">Added to your bag</p>
          {lastAdded.name && <p className="mt-1 truncate text-sm font-medium">{lastAdded.name}</p>}
          <p className="mt-0.5 text-[12px] text-muted">
            {lastAdded.size ? `Size ${lastAdded.size} · ` : ''}Qty {lastAdded.quantity}
            {cartCount > 0 ? ` · ${cartCount} item${cartCount === 1 ? '' : 's'} in bag` : ''}
          </p>
          <div className="mt-3 flex gap-2">
            <Link to="/cart" onClick={close} className="btn-primary min-h-9 px-4 py-2 text-[11px]">
              View bag
            </Link>
            <button
              type="button"
              onClick={close}
              className="min-h-9 px-3 text-[11px] font-medium text-muted transition-colors hover:text-ink"
            >
              Keep shopping
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Dismiss"
          className="btn-icon h-8 w-8 shrink-0 self-start text-muted hover:text-ink"
        >
          <CloseIcon width={14} height={14} />
        </button>
      </div>
    </div>,
    document.body
  );
}
