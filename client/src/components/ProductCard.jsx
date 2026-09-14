import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import StarRating from './StarRating';
import { HeartIcon } from './Icons';

const isRecent = (dateStr) => {
  if (!dateStr) return false;
  const days = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 21;
};

export default function ProductCard({ product }) {
  const { wishlist, toggleWishlist, addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const isWishlisted = wishlist?.some((w) => w.id === product.id);
  const hasDiscount = product.discount_price && Number(product.discount_price) < Number(product.price);
  const discountPct = hasDiscount
    ? Math.round(((product.price - product.discount_price) / product.price) * 100)
    : 0;
  const isNew = isRecent(product.created_at);

  const quickAdd = async (e, size) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate('/login');
    if (adding) return;
    setAdding(true);
    try {
      await addToCart(product.id, size, 1);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1600);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="group relative">
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-sand/40 shadow-sm transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-ink/10">
          <img
            src={product.images?.[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
          {product.images?.[1] && (
            <img
              src={product.images[1]}
              alt={product.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}

          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {hasDiscount && <span className="badge-sale">-{discountPct}%</span>}
            {!hasDiscount && isNew && <span className="badge-new">New</span>}
          </div>

          {user && (
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleWishlist(product.id);
              }}
              aria-label="Toggle wishlist"
              aria-pressed={isWishlisted}
              className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-all duration-200 hover:scale-110 hover:text-red-600 focus-visible:text-red-600 ${isWishlisted ? 'text-red-600' : 'text-muted'}`}
            >
              <HeartIcon
                width={15}
                height={15}
                filled={isWishlisted}
              />
            </button>
          )}

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
            <span className="pointer-events-auto rounded-full bg-white/95 px-6 py-3 text-center text-[12px] font-semibold uppercase tracking-[0.14em] text-ink shadow-lg backdrop-blur-sm transition-colors duration-200 hover:bg-clay hover:text-ink group-focus-within:bg-clay">
              View Details
            </span>
          </div>

          {/* Quick-add overlay */}
          {product.sizes?.length > 0 && (
            <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out bg-white/95 backdrop-blur-sm px-3 py-2.5 hidden md:block">
              {justAdded ? (
                <p className="text-center text-xs font-medium text-accent py-1.5">Added to cart ✓</p>
              ) : (
                <div className="flex flex-wrap justify-center gap-1.5">
                  {product.sizes.slice(0, 6).map((size) => (
                    <button
                      key={size}
                      onClick={(e) => quickAdd(e, size)}
                      disabled={adding}
                      className="text-[12px] font-medium border border-ink/20 px-2 py-1 hover:border-ink hover:bg-ink hover:text-white transition-colors disabled:opacity-50"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="mt-3.5 space-y-1.5 px-0.5">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted">{product.brand}</p>
          <h3 className="line-clamp-1 text-sm font-semibold leading-snug">{product.name}</h3>
          <StarRating rating={product.rating} count={product.num_reviews} />
          <div className="flex items-center gap-2 pt-1">
            <span className="font-semibold">₹{Number(product.discount_price || product.price).toLocaleString('en-IN')}</span>
            {hasDiscount && (
              <span className="text-muted line-through text-sm">₹{Number(product.price).toLocaleString('en-IN')}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
