import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import SkeletonGrid from '../components/SkeletonGrid';
import { TruckIcon, CashIcon, ReturnIcon, CheckShieldIcon } from '../components/Icons';

const TRUST_BADGES = [
  { Icon: TruckIcon, label: 'Free Shipping over \u20b91,999' },
  { Icon: CashIcon, label: 'Cash on Delivery' },
  { Icon: ReturnIcon, label: 'Easy 3-Month Returns' },
  { Icon: CheckShieldIcon, label: 'Quality Assured' },
];

const CURATIONS = [
  {
    title: 'The Linen Edit',
    description: 'Breathable layers for long, unhurried days.',
    image: '/images/products/4/2.jpg',
    to: '/shop?search=Linen',
    size: 'md:col-span-2 md:row-span-2',
  },
  {
    title: 'Texture, considered',
    description: 'Easy structure. A little more character.',
    image: '/images/products/9/3.jpg',
    to: '/shop?search=Textured',
    size: 'md:col-span-2',
  },
  {
    title: 'New in',
    description: 'A fresh rotation for your wardrobe.',
    image: '/images/products/13/2.jpg',
    to: '/shop?sort=newest',
    size: 'md:col-span-2',
  },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products?featured=1&limit=8')
      .then(({ data }) => setFeatured(data.products))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="surface-grid relative overflow-hidden bg-[#ebe4da]">
        <div className="pointer-events-none absolute -left-20 top-24 h-72 w-72 rounded-full bg-clay/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-[35%] bg-white/25" />
        <div className="container-x relative grid items-center gap-10 py-12 md:grid-cols-[.9fr_1.1fr] md:py-20 lg:py-24">
          <div className="order-2 fade-in-up md:order-1 md:pl-8">
            <div className="display-rule mb-5" />
            <p className="eyebrow mb-5">The everyday edit / 2025</p>
            <h1 className="font-serif text-5xl font-semibold leading-[0.94] tracking-[-0.055em] sm:text-6xl md:text-7xl lg:text-8xl">
              Pieces with<br />a point of view.
            </h1>
            <p className="mt-7 max-w-md text-[15px] leading-7 text-muted">
              Easy silhouettes, better fabric, and thoughtful details. The new Koorm collection is designed to become part of your story.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className="btn-primary">Shop the edit <span aria-hidden="true">&rarr;</span></Link>
              <Link to="/shop?sort=newest" className="btn-outline">New arrivals</Link>
            </div>
            <div className="mt-10 flex items-center gap-4 text-xs text-muted">
              <span className="font-serif text-2xl text-ink">01</span>
              <span className="h-px w-10 bg-ink/20" />
              <span>Made for every version of your day.</span>
            </div>
          </div>
          <div className="order-1 relative fade-in md:order-2">
            <div className="absolute -right-3 -top-3 h-full w-full border border-ink/15 md:-right-5 md:-top-5" />
            <img src="/images/products/1/1.jpg" alt="Model wearing a Koorm shirt" className="relative h-[390px] w-full object-cover sm:h-[480px] md:h-[620px]" />
            <div className="absolute bottom-4 left-4 max-w-[180px] bg-[#fbfaf8]/95 p-4 backdrop-blur-sm md:bottom-7 md:left-7">
              <p className="eyebrow mb-1.5">Made to keep</p>
              <p className="font-serif text-lg leading-tight">Everyday essentials, elevated.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-sand/80 bg-white">
        <div className="container-x grid grid-cols-2 gap-6 py-9 md:grid-cols-4 md:py-10">
          {TRUST_BADGES.map(({ Icon, label }) => (
            <div key={label} className="group flex flex-col items-center gap-2.5 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cream text-accent transition-transform duration-200 group-hover:-translate-y-1"><Icon width={20} height={20} /></div>
              <p className="text-xs text-muted sm:text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="the-edit" className="container-x py-20 md:py-28">
        <div className="mx-auto mb-10 max-w-xl text-center md:mb-14">
          <p className="page-kicker justify-center">Shop by mood</p>
          <h2 className="section-title">A wardrobe with range.</h2>
          <p className="mt-4 text-sm leading-6 text-muted">Start with the pieces that fit the moment, then make them entirely your own.</p>
        </div>
        <div className="grid auto-rows-[250px] gap-4 md:grid-cols-4 md:auto-rows-[220px] md:gap-5">
          {CURATIONS.map((curation) => (
            <Link key={curation.title} to={curation.to} className={`group relative overflow-hidden bg-ink ${curation.size}`}>
              <img src={curation.image} alt="" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-6">
                <p className="mb-1 text-[12px] font-bold uppercase tracking-[0.17em] text-[#e8c8a8]">Koorm curated</p>
                <div className="flex items-end justify-between gap-4">
                  <div><h3 className="font-serif text-2xl leading-none md:text-3xl">{curation.title}</h3><p className="mt-2 max-w-xs text-xs leading-5 text-white/75">{curation.description}</p></div>
                  <span className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/60 text-lg transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-x pb-20 md:pb-28">
        <div className="mb-10 flex items-end justify-between">
          <div><p className="eyebrow mb-3">Customer favorites</p><h2 className="section-title">Bestsellers</h2></div>
          <Link to="/shop" className="hidden text-[12px] font-bold uppercase tracking-[0.16em] link-underline hover:text-accent sm:block">View all <span aria-hidden="true">&rarr;</span></Link>
        </div>
        {loading ? <SkeletonGrid count={8} /> : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-4 md:gap-x-6">
            {featured.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </section>

      <section className="container-x pb-4 md:pb-8">
        <div className="group relative overflow-hidden bg-ink">
          <img src="/images/products/9/2.jpg" alt="Season sale" className="h-72 w-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-105 md:h-96" />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 px-4 text-center text-white">
            <p className="mb-4 text-[12px] font-bold uppercase tracking-[0.25em] text-[#e8c8a8]">A little extra, just for you</p>
            <h3 className="mb-7 font-serif text-4xl leading-[0.95] tracking-[-0.04em] md:text-6xl">The season<br />sale is on.</h3>
            <Link to="/shop" className="btn-primary bg-[#fbfaf8] text-ink hover:bg-white">Discover the sale <span aria-hidden="true">&rarr;</span></Link>
          </div>
        </div>
      </section>

      <section className="container-x py-20 md:py-28">
        <div className="grid overflow-hidden border border-sand/90 bg-white md:grid-cols-[1.05fr_.95fr]">
          <div className="order-2 p-8 sm:p-12 md:order-1 md:p-16">
            <p className="page-kicker">The Koorm standard</p>
            <h2 className="font-serif text-4xl leading-[0.98] tracking-[-0.04em] md:text-5xl">Fewer pieces.<br />Better days in them.</h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-muted">We focus on versatile fabrics, dependable fits, and details that improve the clothes you reach for most. No noise, just a well-made starting point.</p>
            <div className="mt-9 grid grid-cols-3 gap-4 border-t border-sand pt-6">
              <div><p className="font-serif text-2xl">15+</p><p className="mt-1 text-[12px] font-bold uppercase tracking-[0.12em] text-muted">Colorways</p></div>
              <div><p className="font-serif text-2xl">3 months</p><p className="mt-1 text-[12px] font-bold uppercase tracking-[0.12em] text-muted">Easy returns</p></div>
              <div><p className="font-serif text-2xl">4.5/5</p><p className="mt-1 text-[12px] font-bold uppercase tracking-[0.12em] text-muted">Loved by you</p></div>
            </div>
          </div>
          <div className="order-1 min-h-[310px] md:order-2 md:min-h-full"><img src="/images/products/12/4.jpg" alt="Detail of a Koorm garment" className="h-full w-full object-cover" /></div>
        </div>
      </section>
    </div>
  );
}
