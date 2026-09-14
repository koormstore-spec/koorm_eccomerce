import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import SkeletonGrid from '../components/SkeletonGrid';
import { TruckIcon, CashIcon, ReturnIcon, ChevronRightIcon } from '../components/Icons';

const EDITS = [
  { name: 'The linen edit', detail: 'Light layers. Long weekends.', image: '/images/products/4/1.jpg', to: '/shop?search=Linen', number: '01' },
  { name: 'A little texture', detail: 'The difference is in the detail.', image: '/images/products/9/1.jpg', to: '/shop?search=Textured', number: '02' },
  { name: 'Your everyday blues', detail: 'An easy choice, every time.', image: '/images/products/13/2.jpg', to: '/shop?search=Blue', number: '03' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get('/products?featured=1&limit=8')
      .then(({ data }) => setFeatured(data.products))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="home-page">
      <section className="container-x pt-4 sm:pt-6" aria-labelledby="hero-title">
        <div className="campaign-hero">
          <div className="campaign-copy">
            <p className="eyebrow text-[#d3dcc8]">The everyday collection</p>
            <h1 id="hero-title">Everyday,<br /><em>well dressed.</em></h1>
            <p className="campaign-description">Good fabric. An effortless fit. Shirts you’ll reach for, day after day.</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link to="/shop" className="btn-primary bg-cream text-ink hover:bg-white">Shop shirts <span aria-hidden="true">↗</span></Link>
              <Link to="/shop?sort=newest" className="text-sm text-cream underline underline-offset-8 decoration-cream/40 hover:decoration-cream">New arrivals</Link>
            </div>
            <p className="campaign-footnote"><span className="h-1.5 w-1.5 rounded-full bg-[#c4d1b6]" /> Made for the way you live.</p>
          </div>
          <div className="campaign-photo">
            <img src="/images/products/4/1.jpg" alt="Sage green linen shirt styled with relaxed cream trousers" width="1000" height="1333" fetchPriority="high" />
            <Link to="/shop?search=Linen" className="campaign-caption"><span><span className="block text-[10px] uppercase tracking-[0.16em] text-muted">In focus</span><span className="mt-1 block text-sm font-medium">The linen edit</span></span><span className="text-xl" aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>

      <section className="container-x" aria-label="Shopping benefits">
        <div className="shopping-benefits">
          {[
            { Icon: TruckIcon, title: 'Delivered to your door', detail: 'Free shipping over ₹1,999' },
            { Icon: ReturnIcon, title: 'Room to change your mind', detail: 'Easy 3-month returns' },
            { Icon: CashIcon, title: 'Keep it simple', detail: 'Cash on delivery available' },
          ].map(({ Icon, title, detail }) => <div key={title} className="flex items-center gap-3 sm:gap-4"><Icon width={23} height={23} className="shrink-0 text-accent" /><div><p className="text-xs font-medium sm:text-sm">{title}</p><p className="mt-1 text-[11px] leading-relaxed text-muted sm:text-xs">{detail}</p></div></div>)}
        </div>
      </section>

      <section id="the-edit" className="container-x section-space">
        <div className="section-heading"><div><p className="eyebrow mb-3">Find your everyday</p><h2 className="section-title">A shirt for every mood.</h2></div><Link to="/shop" className="text-link">Shop all shirts <span aria-hidden="true">↗</span></Link></div>
        <div className="edit-grid">
          {EDITS.map((edit) => <Link to={edit.to} key={edit.number} className="edit-card group">
            <div className="edit-image"><img src={edit.image} alt={edit.name} width="1000" height="1333" loading="lazy" decoding="async" /><span className="edit-number">{edit.number}</span></div>
            <div className="mt-4 flex items-center justify-between gap-3"><h3 className="font-serif text-2xl tracking-[-0.025em]">{edit.name}</h3><span className="edit-arrow" aria-hidden="true">↗</span></div>
            <p className="mt-1 text-sm text-muted">{edit.detail}</p>
          </Link>)}
        </div>
      </section>

      <section className="container-x section-space pt-0">
        <div className="section-heading"><div><p className="eyebrow mb-3">On repeat</p><h2 className="section-title">Meet your new favourites.</h2></div><Link to="/shop?sort=rating" className="text-link">View the collection <span aria-hidden="true">↗</span></Link></div>
        {loading ? <SkeletonGrid count={8} cols="grid-cols-2 md:grid-cols-3 lg:grid-cols-4" /> : error ? <div className="panel p-8 text-center"><p className="text-muted">We couldn’t load the collection just now.</p><Link to="/shop" className="text-link mt-4">Browse the shop <span aria-hidden="true">↗</span></Link></div> : <div className="product-grid">{featured.map(product => <ProductCard key={product.id} product={product} />)}</div>}
      </section>

      <section className="container-x pb-12 md:pb-20">
        <div className="brand-story">
          <div className="brand-story-photo"><img src="/images/products/9/1.jpg" alt="A close look at the white textured Koorm shirt" width="1000" height="1333" loading="lazy" decoding="async" /></div>
          <div className="brand-story-copy"><p className="eyebrow mb-5">The Koorm approach</p><h2 className="section-title">Less effort.<br /><em>More you.</em></h2><p className="mt-6 max-w-md text-sm leading-7 text-muted">Getting dressed should feel good. We bring together easy silhouettes, considered details, and colours that work with the wardrobe you already love.</p><p className="mt-4 max-w-md text-sm leading-7 text-muted">For the morning coffee, the last-minute plan, and everything in between.</p><Link to="/about" className="text-link mt-7">A little about us <span aria-hidden="true">↗</span></Link><div className="mt-10 flex items-center gap-3 border-t border-ink/15 pt-5 text-xs text-muted"><span className="font-serif text-xl text-ink">KOORM</span><span className="ml-auto">Your everyday, considered.</span></div></div>
        </div>
      </section>

      <section className="container-x pb-4"><div className="flex flex-col items-start justify-between gap-5 border-y border-sand py-7 sm:flex-row sm:items-center"><div><p className="font-serif text-2xl">Your next favourite is waiting.</p><p className="mt-1 text-sm text-muted">Find the pieces that feel like you.</p></div><Link to="/shop" className="btn-primary">Find your fit <ChevronRightIcon width={16} height={16} /></Link></div></section>
    </div>
  );
}
