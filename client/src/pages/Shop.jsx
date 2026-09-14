import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import SkeletonGrid from '../components/SkeletonGrid';
import { ChevronDownIcon, ChevronRightIcon, CloseIcon } from '../components/Icons';

const CATEGORIES = ['men'];
const SORT_OPTIONS = [
  { value: '', label: 'Recommended' },
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
];
const DISCOVERY_LINKS = [
  { label: 'All shirts', params: {} },
  { label: 'New arrivals', params: { sort: 'newest' } },
  { label: 'Bestsellers', params: { sort: 'rating' } },
  { label: 'Linen edit', params: { search: 'Linen' } },
  { label: 'Textured shirts', params: { search: 'Textured' } },
];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const page = Number(searchParams.get('page') || 1);

  const updateParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    next.delete('page');
    setSearchParams(next);
  };

  const clearAll = () => setSearchParams({});

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 16 };
    if (category) params.category = category;
    if (search) params.search = search;
    if (sort) params.sort = sort;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    api.get('/products', { params })
      .then(({ data }) => { setProducts(data.products); setPages(data.pages); setTotal(data.total); })
      .finally(() => setLoading(false));
  }, [category, search, sort, minPrice, maxPrice, page]);

  const hasActiveFilters = category || minPrice || maxPrice || search;
  const title = search ? `Results for “${search}”` : category ? `${category}’s collection` : sort === 'newest' ? 'New arrivals' : sort === 'rating' ? 'Bestsellers' : 'The shirt collection';

  const FilterContent = () => (
    <div className="space-y-7">
      <div>
        <div className="mb-3 flex items-center justify-between"><h3 className="text-[12px] font-bold uppercase tracking-[0.15em]">Category</h3><span className="text-[12px] text-muted">01</span></div>
        <div className="space-y-1">
          <button onClick={() => updateParams({ category: '' })} className={`flex w-full items-center justify-between py-2 text-sm transition-colors ${!category ? 'font-semibold text-ink' : 'text-muted hover:text-ink'}`}><span>All pieces</span>{!category && <span className="h-1.5 w-1.5 rounded-full bg-clay" />}</button>
          {CATEGORIES.map((item) => <button key={item} onClick={() => updateParams({ category: item })} className={`flex w-full items-center justify-between py-2 text-sm capitalize transition-colors ${category === item ? 'font-semibold text-ink' : 'text-muted hover:text-ink'}`}><span>{item}</span>{category === item && <span className="h-1.5 w-1.5 rounded-full bg-clay" />}</button>)}
        </div>
      </div>
      <div className="border-t border-sand pt-6">
        <div className="mb-3 flex items-center justify-between"><h3 className="text-[12px] font-bold uppercase tracking-[0.15em]">Price range</h3><span className="text-[12px] text-muted">INR</span></div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <input type="number" placeholder="Min" defaultValue={minPrice} onBlur={(event) => updateParams({ minPrice: event.target.value })} className="input-field min-w-0 px-3 py-2.5 text-xs" />
          <span className="text-muted">&ndash;</span>
          <input type="number" placeholder="Max" defaultValue={maxPrice} onBlur={(event) => updateParams({ maxPrice: event.target.value })} className="input-field min-w-0 px-3 py-2.5 text-xs" />
        </div>
      </div>
      {hasActiveFilters && <button onClick={clearAll} className="text-xs font-medium text-muted link-underline hover:text-ink">Clear all filters</button>}
    </div>
  );

  return (
    <div className="fade-in">
      <section className="border-b border-sand bg-[#eee9e1]">
        <div className="container-x py-7 md:py-10">
          <div className="mb-5 flex items-center gap-1.5 text-[12px] text-muted"><Link to="/" className="hover:text-ink">Home</Link><ChevronRightIcon width={12} height={12} /><span className="text-muted">Shop</span></div>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div><p className="page-kicker">Koorm essentials</p><h1 className="section-title capitalize">{title}</h1><p className="mt-3 max-w-md text-sm leading-6 text-muted">Considered staples made to make getting dressed feel easier.</p></div>
            <p className="shrink-0 text-xs font-medium uppercase tracking-[0.12em] text-muted">{total} piece{total === 1 ? '' : 's'} to discover</p>
          </div>
        </div>
      </section>

      <div className="container-x py-5 md:py-7">
        <div className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 sm:-mx-7 sm:px-7 lg:-mx-10 lg:px-10">
          {DISCOVERY_LINKS.map((link) => {
            const active = Object.entries(link.params).every(([key, value]) => searchParams.get(key) === value) && Object.keys(link.params).length === [...searchParams.keys()].filter((key) => key !== 'page').length;
            return <button key={link.label} onClick={() => setSearchParams(link.params)} className={`collection-chip whitespace-nowrap ${active ? '!border-ink !bg-ink !text-cream' : ''}`}>{link.label}</button>;
          })}
        </div>

        {hasActiveFilters && <div className="mt-5 flex flex-wrap items-center gap-2"><span className="mr-1 text-[12px] font-bold uppercase tracking-[0.14em] text-muted">Filtering by</span>{search && <button onClick={() => updateParams({ search: '' })} className="filter-pill">“{search}” <CloseIcon width={12} height={12} /></button>}{category && <button onClick={() => updateParams({ category: '' })} className="filter-pill capitalize">{category} <CloseIcon width={12} height={12} /></button>}{(minPrice || maxPrice) && <button onClick={() => updateParams({ minPrice: '', maxPrice: '' })} className="filter-pill">&#8377;{minPrice || '0'} &ndash; &#8377;{maxPrice || 'any'} <CloseIcon width={12} height={12} /></button>}<button onClick={clearAll} className="ml-1 text-xs text-muted link-underline hover:text-ink">Clear all</button></div>}

        <div className="mt-7 flex gap-8 xl:gap-10">
          <aside className="hidden w-56 shrink-0 xl:block">
            <div className="sticky top-32 border-t border-ink pt-4"><div className="mb-6 flex items-center justify-between"><h2 className="text-[12px] font-bold uppercase tracking-[0.18em]">Filters</h2>{hasActiveFilters && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-clay text-[12px] text-white">!</span>}</div><FilterContent /></div>
          </aside>
          <div className="min-w-0 flex-1">
            <div className="mb-6 flex items-center justify-between border-y border-sand py-3">
              <button className="btn-outline px-4 py-2 text-[12px] xl:hidden" onClick={() => setFiltersOpen(true)}>Filters {hasActiveFilters && <span className="ml-1 text-accent">&bull;</span>}</button>
              <p className="hidden text-xs text-muted xl:block">Showing a thoughtful selection of {total} pieces</p>
              <div className="relative ml-auto"><select value={sort} onChange={(event) => updateParams({ sort: event.target.value })} className="h-10 appearance-none rounded-full border border-sand bg-white py-2 pl-4 pr-9 text-xs outline-none transition-colors hover:border-ink"><option value="">Sort: Recommended</option>{SORT_OPTIONS.filter((option) => option.value).map((option) => <option key={option.value} value={option.value}>Sort: {option.label}</option>)}</select><ChevronDownIcon width={14} height={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" /></div>
            </div>

            {loading ? <SkeletonGrid count={8} cols="grid-cols-2 md:grid-cols-3 xl:grid-cols-4" /> : products.length === 0 ? (
              <div className="panel py-20 text-center"><p className="font-serif text-2xl">Nothing quite like that.</p><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">Try another collection or remove a filter to see more of the edit.</p><button onClick={clearAll} className="btn-outline mt-6 px-5 py-2.5 text-[12px]">View all pieces</button></div>
            ) : (
              <><div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-5 xl:grid-cols-4 xl:gap-x-6">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
              {pages > 1 && <div className="mt-14 flex items-center justify-center gap-2">{Array.from({ length: pages }, (_, index) => index + 1).map((number) => <button key={number} onClick={() => { const next = new URLSearchParams(searchParams); next.set('page', number); setSearchParams(next); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`flex h-10 w-10 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${number === page ? 'border-ink bg-ink text-cream' : 'border-sand hover:border-ink'}`}>{number}</button>)}</div>}</>
            )}
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 z-[60] transition-opacity duration-300 xl:hidden ${filtersOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
        <div className={`absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col bg-[#fbfaf8] shadow-2xl transition-transform duration-300 ease-out ${filtersOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex h-20 items-center justify-between border-b border-sand px-6"><div><p className="text-[12px] font-bold uppercase tracking-[0.16em] text-accent">Refine the edit</p><h2 className="mt-1 font-serif text-xl">Filters</h2></div><button onClick={() => setFiltersOpen(false)} className="btn-icon h-9 w-9" aria-label="Close filters"><CloseIcon width={17} height={17} /></button></div>
          <div className="flex-1 overflow-y-auto p-6"><FilterContent /></div>
          <div className="border-t border-sand p-5"><button onClick={() => setFiltersOpen(false)} className="btn-primary w-full">Show {total} result{total === 1 ? '' : 's'}</button></div>
        </div>
      </div>
    </div>
  );
}
