import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { savePendingAdd, readPendingAdd, clearPendingAdd } from '../utils/pendingCart';
import StarRating from '../components/StarRating';
import ProductCard from '../components/ProductCard';
import ProductGallery from '../components/ProductGallery';
import Loader from '../components/Loader';
import NotifyRestockForm from '../components/NotifyRestockForm';
import SizeGuideButton from '../components/SizeGuideButton';

// Anything under this still sells, but is worth flagging so a shopper
// doesn't lose out to someone else checking out first.
const LOW_STOCK_THRESHOLD = 5;
import { HeartIcon, PlusIcon, MinusIcon, TruckIcon, CashIcon, ReturnIcon, ChevronRightIcon, CheckIcon } from '../components/Icons';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, wishlist, toggleWishlist } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');
  const [resumed, setResumed] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [openSection, setOpenSection] = useState('details');
  // Where the flying add-to-bag thumbnail takes off from.
  const galleryRef = useRef(null);
  const resumedRef = useRef(false);

  const load = () => {
    setLoading(true);
    api.get(`/products/${slug}`)
      .then(({ data }) => { setProduct(data); setSelectedSize(''); setQty(1); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { resumedRef.current = false; load(); }, [slug]);

  const addSelectionToCart = async (size, quantity) => {
    await addToCart(product.id, size, quantity, {
      name: product.name,
      slug: product.slug || slug,
      image: product.images?.[0],
      originEl: galleryRef.current,
    });
  };

  // Coming back from login with an add still pending: put the piece in the bag
  // ourselves so the trip through the login screen costs nothing.
  useEffect(() => {
    if (!product || !user || resumedRef.current) return;
    const intent = readPendingAdd();
    if (!intent || intent.slug !== slug) return;
    if (Number(product.stock) <= 0) return; // sold out since — leave the intent for a manual retry

    resumedRef.current = true;
    clearPendingAdd();
    const size = product.sizes?.includes(intent.size) ? intent.size : product.sizes?.[0];
    if (!size) return;
    const quantity = Math.min(Number(product.stock) || 1, Number(intent.quantity) > 0 ? Number(intent.quantity) : 1);

    setSelectedSize(size);
    setQty(quantity);
    setAdding(true);
    addToCart(product.id, size, quantity, {
      name: product.name,
      slug: product.slug || slug,
      image: product.images?.[0],
      originEl: galleryRef.current,
    })
      .then(() => setResumed(true))
      .catch(() => setMessage('We could not add this automatically — please try again.'))
      .finally(() => setAdding(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, user, slug]);

  const handleAddToCart = async () => {
    if (Number(product.stock) <= 0) return;
    if (!selectedSize) { setMessage('Select a size to add this piece.'); return; }
    // Logged out: remember the exact selection, then come back to this page.
    if (!user) {
      savePendingAdd({ slug, size: selectedSize, quantity: qty });
      return navigate('/login', { state: { from: { pathname: `/product/${slug}` } } });
    }
    setAdding(true);
    try {
      await addSelectionToCart(selectedSize, qty);
      setMessage('Added to your bag.');
      setTimeout(() => setMessage(''), 2200);
    } finally { setAdding(false); }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!user) return navigate('/login');
    await api.post('/reviews', { product_id: product.id, rating: reviewRating, comment: reviewComment });
    setReviewComment('');
    load();
  };

  if (loading) return <Loader full />;
  if (!product) return <p className="container-x py-20 text-center">Product not found.</p>;

  const isWishlisted = wishlist?.some((item) => item.id === product.id);
  const hasDiscount = product.discount_price && Number(product.discount_price) < Number(product.price);
  const displayPrice = Number(product.discount_price || product.price);
  const discount = hasDiscount ? Math.round(((Number(product.price) - Number(product.discount_price)) / Number(product.price)) * 100) : 0;
  const stock = Number(product.stock) || 0;
  const outOfStock = stock <= 0;
  const lowStock = !outOfStock && stock < LOW_STOCK_THRESHOLD;

  const benefits = [
    { Icon: TruckIcon, title: 'Free delivery', text: `On orders above ${String.fromCharCode(8377)}1,999` },
    { Icon: CashIcon, title: 'Pay your way', text: 'Cash on delivery available' },
    { Icon: ReturnIcon, title: 'Easy returns', text: 'A simple 3-month return window' },
  ];

  return (
    <div className="pb-28 md:pb-0">
      <div className="container-x py-5 md:py-7">
        <div className="flex items-center gap-1.5 overflow-hidden text-[12px] text-muted"><Link to="/" className="shrink-0 hover:text-ink">Home</Link><ChevronRightIcon width={12} height={12} className="shrink-0" /><Link to={`/shop?category=${product.category_slug}`} className="shrink-0 capitalize hover:text-ink">{product.category_name || 'Shop'}</Link><ChevronRightIcon width={12} height={12} className="shrink-0" /><span className="truncate text-muted">{product.name}</span></div>
      </div>

      <div className="container-x grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,.65fr)] lg:gap-12 xl:gap-16">
        <section ref={galleryRef} className="min-w-0" aria-label="Product gallery">
          <ProductGallery key={slug} images={product.images || []} name={product.name} />
        </section>

        <section className="lg:sticky lg:top-32 lg:h-fit lg:pb-10">
          {resumed && (
            <div className="coupon-applied mb-5 border-clay/40 bg-clay/10" role="status">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-cream"><CheckIcon width={15} height={15} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold">Welcome back — this is in your bag.</p>
                <p className="mt-0.5 text-[12px] text-muted">We picked up right where you left off.</p>
              </div>
              <Link to="/cart" className="shrink-0 text-[12px] font-semibold text-accent link-underline">View bag</Link>
            </div>
          )}
          <p className="page-kicker">{product.brand || 'Koorm'}</p>
          <div className="flex items-start justify-between gap-4"><h1 className="font-serif text-3xl leading-[1.12] tracking-[-0.03em] xl:text-4xl">{product.name}</h1>{user && <button onClick={() => toggleWishlist(product.id)} className="btn-icon shrink-0" aria-label="Add to wishlist"><HeartIcon width={19} height={19} filled={isWishlisted} className={isWishlisted ? 'text-accent' : ''} /></button>}</div>
          <div className="mt-4 flex flex-wrap items-center gap-3"><StarRating rating={product.rating} count={product.num_reviews} iconSize={14} /><span className="h-4 w-px bg-sand" /><span className="text-xs text-muted">Inclusive of all taxes</span></div>

          <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1"><span className="text-2xl font-semibold">&#8377;{displayPrice.toLocaleString('en-IN')}</span>{hasDiscount && <><span className="text-sm text-muted line-through">&#8377;{Number(product.price).toLocaleString('en-IN')}</span><span className="text-xs font-bold uppercase tracking-[0.1em] text-accent">Save {discount}%</span></>}</div>

          <div className="mt-7 border-y border-sand py-6">
            <div className="flex items-center justify-between"><div><p className="text-[12px] font-bold uppercase tracking-[0.15em] text-muted">Colour</p><p className="mt-1 text-sm font-medium">{product.colors?.[0] || 'Signature shade'}</p></div><span className="h-7 w-7 rounded-full border-2 border-white bg-clay shadow-[0_0_0_1px_rgba(26,26,26,.24)]" title={product.colors?.[0] || 'Colour'} /></div>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-end justify-between"><div><p className="text-sm font-semibold">Select size</p><p className="mt-1 text-xs text-muted">Fits true to size</p></div><SizeGuideButton /></div>
            <div className="grid grid-cols-5 gap-2">{product.sizes.map((size) => <button key={size} disabled={outOfStock} onClick={() => { setSelectedSize(size); setMessage(''); }} className={`h-11 border text-xs font-semibold transition-[color,background-color,border-color,transform] duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${selectedSize === size ? 'border-ink bg-ink text-cream' : 'border-sand bg-white hover:border-ink'}`}>{size}</button>)}</div>
          </div>

          {outOfStock ? (
            <div className="fade-in-soft mt-7"><NotifyRestockForm productId={product.id} /></div>
          ) : (
            <>
              <div className="mt-6 flex items-center gap-4"><div><p className="mb-2 text-[12px] font-bold uppercase tracking-[0.15em] text-muted">Quantity</p><div className="flex w-28 items-center border border-sand bg-white"><button onClick={() => setQty((value) => Math.max(1, value - 1))} className="flex h-10 flex-1 items-center justify-center hover:bg-cream" aria-label="Decrease quantity"><MinusIcon width={14} height={14} /></button><span className="flex-1 text-center text-sm font-semibold">{qty}</span><button onClick={() => setQty((value) => Math.min(stock, value + 1))} disabled={qty >= stock} className="flex h-10 flex-1 items-center justify-center hover:bg-cream disabled:cursor-not-allowed disabled:opacity-40" aria-label="Increase quantity"><PlusIcon width={14} height={14} /></button></div></div><button onClick={handleAddToCart} disabled={adding} className="btn-primary mt-6 flex-1">{adding ? 'Adding...' : 'Add to bag'} <span aria-hidden="true">&rarr;</span></button></div>
              {lowStock && <p className="fade-in-soft mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-clay" role="status">Only {stock} left in stock — order soon</p>}
              {message && <p className="fade-in-soft mt-3 text-sm font-medium text-accent" role="status">{message}</p>}
            </>
          )}

          <div className="mt-7 grid divide-y divide-sand border-y border-sand">{benefits.map(({ Icon, title: benefitTitle, text }) => <div key={benefitTitle} className="flex items-center gap-3 py-3.5"><Icon width={17} height={17} className="shrink-0 text-accent" /><div><p className="text-xs font-semibold">{benefitTitle}</p><p className="mt-0.5 text-[12px] text-muted">{text}</p></div></div>)}</div>
        </section>
      </div>

      <section className="container-x mt-16 md:mt-24"><div className="grid gap-10 border-t border-ink pt-1 md:grid-cols-[.72fr_1.28fr]"><div className="pt-7"><p className="page-kicker">About the piece</p><h2 className="font-serif text-3xl leading-none tracking-[-0.04em]">Made for regular rotation.</h2></div><div className="pt-3">{[
        { id: 'details', label: 'Details & fit', content: <p className="max-w-2xl pb-5 pr-3 text-sm leading-7 text-muted">{product.description}</p> },
        { id: 'reviews', label: `Reviews (${product.reviews.length})`, content: <div className="space-y-5 pb-5">{user && <form onSubmit={submitReview} className="panel space-y-3 p-4"><p className="text-sm font-semibold">Write a review</p><div className="flex flex-wrap items-center gap-3"><select value={reviewRating} onChange={(event) => setReviewRating(Number(event.target.value))} className="input-field w-auto py-2 text-xs">{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} star{rating === 1 ? '' : 's'}</option>)}</select><button type="submit" className="btn-primary px-4 py-2 text-[12px]">Post review</button></div><textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} placeholder="How did it feel?" className="input-field text-sm" rows={3} /></form>}{product.reviews.length === 0 ? <p className="text-sm text-muted">No reviews yet. Be the first to share your thoughts.</p> : product.reviews.map((review) => <article key={review.id} className="border-b border-sand pb-4"><div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold">{review.user_name}</p><StarRating rating={review.rating} /></div><p className="text-sm leading-6 text-muted">{review.comment}</p></article>)}</div> },
      ].map((section) => <div key={section.id}><button className="accordion-row" onClick={() => setOpenSection(openSection === section.id ? '' : section.id)}><span>{section.label}</span><span className="text-lg font-normal">{openSection === section.id ? '−' : '+'}</span></button>{openSection === section.id && <div className="pt-4">{section.content}</div>}</div>)}</div></div></section>

      {product.related?.length > 0 && <section className="container-x mt-20 md:mt-28"><div className="mb-9 flex items-end justify-between"><div><p className="page-kicker">Keep exploring</p><h2 className="section-title">You may also like</h2></div><Link to="/shop" className="hidden text-[12px] font-bold uppercase tracking-[0.15em] link-underline sm:block">View all &rarr;</Link></div><div className="product-grid">{product.related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>}

      {createPortal(<div className="pb-[max(0.75rem,env(safe-area-inset-bottom))] fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-sand bg-white/95 p-3 backdrop-blur md:hidden">{user && <button onClick={() => toggleWishlist(product.id)} className="btn-outline w-12 shrink-0 px-0" aria-label="Wishlist"><HeartIcon width={18} height={18} filled={isWishlisted} className={isWishlisted ? 'text-accent' : ''} /></button>}{outOfStock ? <button disabled className="btn-primary flex-1 opacity-60">Out of stock</button> : <button onClick={handleAddToCart} disabled={adding} className="btn-primary flex-1">{adding ? 'Adding...' : 'Add to bag'}</button>}</div>, document.body)}
    </div>
  );
}
