import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { savePendingAdd } from '../utils/pendingCart';
import { HeartIcon, StarIcon } from './Icons';

const isRecent = (date) => date && (Date.now() - new Date(date).getTime()) / 86400000 <= 21;
const LOW_STOCK_THRESHOLD = 5;

export default function ProductCard({ product }) {
  const { wishlist, toggleWishlist, addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [error, setError] = useState('');
  const mediaRef = useRef(null);
  const isWishlisted = wishlist?.some(item => item.id === product.id);
  const hasDiscount = product.discount_price && Number(product.discount_price) < Number(product.price);
  const discount = hasDiscount ? Math.round((product.price - product.discount_price) / product.price * 100) : 0;
  const stock = Number(product.stock);
  const outOfStock = Number.isFinite(stock) && stock <= 0;
  const lowStock = !outOfStock && Number.isFinite(stock) && stock < LOW_STOCK_THRESHOLD;

  const quickAdd = async (size) => {
    if (adding || outOfStock) return;
    // Logged out: hold the selection and send them to the product itself, so
    // after login the piece lands in the bag right where they picked it.
    if (!user) {
      savePendingAdd({ slug: product.slug, size, quantity: 1 });
      return navigate('/login', { state: { from: { pathname: `/product/${product.slug}` } } });
    }
    setAdding(true);
    setError('');
    try {
      await addToCart(product.id, size, 1, {
        name: product.name,
        slug: product.slug,
        image: product.images?.[0],
        originEl: mediaRef.current,
      });
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1600);
    } catch {
      setError('Please try again.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="product-card group min-w-0">
      <div ref={mediaRef} className="product-card-media">
        <Link to={`/product/${product.slug}`} className="block h-full" aria-label={`View ${product.name}`}>
          <img src={product.images?.[0]} alt={product.name} width="1000" height="1333" loading="lazy" decoding="async" className={outOfStock ? 'opacity-50' : ''} />
          {product.images?.[1] && <img src={product.images[1]} alt="" aria-hidden="true" width="1000" height="1333" loading="lazy" decoding="async" className="product-card-image-alt" />}
        </Link>
        <div className="absolute left-2 top-2 flex flex-col gap-1 sm:left-3 sm:top-3">
          {outOfStock ? <span className="inline-flex rounded-sm bg-ink/90 px-2 py-1 text-[10px] font-medium text-cream">Sold out</span> : hasDiscount ? <span className="inline-flex rounded-sm bg-cream/95 px-2 py-1 text-[10px] font-medium text-ink">-{discount}%</span> : isRecent(product.created_at) ? <span className="inline-flex rounded-sm bg-cream/95 px-2 py-1 text-[10px] font-medium">New</span> : null}
        </div>
        {user && <button type="button" onClick={() => toggleWishlist(product.id)} aria-label="Toggle wishlist" aria-pressed={isWishlisted} className={`absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full sm:right-2 sm:top-2 ${isWishlisted ? 'text-red-600' : 'text-ink'}`}><span className="flex h-8 w-8 items-center justify-center rounded-full bg-cream/90"><HeartIcon width={17} height={17} filled={isWishlisted} /></span></button>}
        {outOfStock ? <div className="product-quick-add"><p className="text-center text-xs text-muted">Currently sold out</p><Link to={`/product/${product.slug}`} className="mt-1 block text-center text-[11px] font-semibold text-accent link-underline">Notify me when it's back &rarr;</Link></div> : product.sizes?.length > 0 && <div className="product-quick-add">
          {justAdded ? <p className="fade-in-soft py-1 text-center text-xs text-accent" role="status">Added to bag ✓</p> : <><p className="mb-2 text-center text-[10px] font-medium uppercase tracking-[0.1em]">Quick add</p><div className="flex flex-wrap justify-center gap-1">{product.sizes.slice(0, 6).map(size => <button type="button" key={size} onClick={() => quickAdd(size)} disabled={adding} className="min-h-9 min-w-8 border border-ink/15 px-2 text-xs transition-[color,background-color,transform] duration-200 hover:bg-ink hover:text-cream active:scale-95 disabled:opacity-50">{size}</button>)}</div></>}
          {error && <p role="alert" className="mt-2 text-center text-xs text-red-700">{error}</p>}
        </div>}
      </div>
      <div className="pt-3 sm:pt-4">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1"><p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">{product.brand || 'Koorm'}</p>{Number(product.num_reviews) > 0 && <span className="inline-flex items-center gap-1 text-[10px] text-muted" aria-label={`${product.rating} out of 5, ${product.num_reviews} reviews`}><StarIcon width={11} height={11} filled className="text-accent" />{Number(product.rating).toFixed(1)} <span>({product.num_reviews})</span></span>}</div>
        <Link to={`/product/${product.slug}`} className="block"><h3 className="line-clamp-2 min-h-[2.5rem] text-[13px] font-medium leading-5 text-ink sm:text-sm">{product.name}</h3></Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1"><span className="text-sm font-semibold">₹{Number(product.discount_price || product.price).toLocaleString('en-IN')}</span>{hasDiscount && <span className="text-xs text-muted line-through">₹{Number(product.price).toLocaleString('en-IN')}</span>}</div>
        {lowStock && <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-clay">Only {stock} left</p>}
      </div>
    </article>
  );
}
