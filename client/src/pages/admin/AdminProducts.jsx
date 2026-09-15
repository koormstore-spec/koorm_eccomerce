import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import adminApi from '../../api/adminAxios';
import AdminLayout from '../../components/AdminLayout';
import Loader from '../../components/Loader';
import { PlusIcon, TrashIcon } from '../../components/Icons';
import { AdminIcon, AdminNotice, AdminEmpty, AdminSearch, AdminPagination, AdminConfirm, StatusBadge, money } from '../../components/admin/AdminUI';

const PAGE_SIZE = 12;

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [featured, setFeatured] = useState(false);
  const [sort, setSort] = useState('newest');
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    api.get('/products', { params: { page, limit: PAGE_SIZE, search: search || undefined, featured: featured ? 1 : undefined, sort }, signal: controller.signal })
      .then(({ data }) => { setProducts(data.products); setTotal(data.total); setPages(Math.max(1, data.pages)); })
      .catch(() => { if (!controller.signal.aborted) setError('We couldn’t load the product collection. Please try again.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, search, featured, sort, refresh]);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true); setDeleteError('');
    try {
      await adminApi.delete(`/products/${deleteTarget.id}`);
      setNotice(`“${deleteTarget.name}” was deleted.`);
      setDeleteTarget(null);
      if (products.length === 1 && page > 1) setPage(value => value - 1);
      else setRefresh(value => value + 1);
    } catch (err) { setDeleteError(err.response?.data?.message || 'The product could not be deleted. Please try again.'); }
    finally { setDeleting(false); }
  };
  const openDelete = product => { setDeleteError(''); setDeleteTarget(product); };
  const actions = product => <div className="flex items-center gap-2"><Link to={`/admin/products/${product.id}/edit`} state={{ product }} className="admin-secondary min-h-10 px-3 py-2" aria-label={`Edit ${product.name}`}>Edit</Link><button type="button" onClick={() => openDelete(product)} className="admin-icon-button text-red-700" aria-label={`Delete ${product.name}`}><TrashIcon width={16} height={16} /></button></div>;
  const stock = product => <StatusBadge status={Number(product.stock) === 0 ? 'out-of-stock' : Number(product.stock) < 10 ? 'low-stock' : 'in-stock'} />;
  const photo = product => <div className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#eeeee9]">{product.images?.[0] ? <img src={product.images[0]} alt="" className="h-full w-full object-cover object-top" loading="lazy" /> : <AdminIcon type="image" className="text-muted" />}</div>;

  return <AdminLayout title="Your collection" description="Every piece, in one place. Manage products, pricing, and availability." actions={<Link to="/admin/products/new" className="admin-primary"><PlusIcon width={16} height={16} />Add product</Link>}>
    {notice && <div className="mb-5"><AdminNotice success>{notice}</AdminNotice></div>}
    <section className="admin-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand px-4 sm:px-6"><div className="flex gap-5"><button type="button" onClick={() => { setFeatured(false); setPage(1); }} aria-pressed={!featured} className={`min-h-14 border-b-2 text-xs font-semibold ${!featured ? 'border-ink text-ink' : 'border-transparent text-muted'}`}>All products</button><button type="button" onClick={() => { setFeatured(true); setPage(1); }} aria-pressed={featured} className={`min-h-14 border-b-2 text-xs font-semibold ${featured ? 'border-ink text-ink' : 'border-transparent text-muted'}`}>Featured</button></div><p className="py-2 text-xs text-muted">{loading ? 'Loading collection…' : `${total} products in this view`}</p></div>
      <div className="flex flex-col gap-3 border-b border-sand p-4 sm:flex-row sm:px-6"><AdminSearch value={query} onChange={setQuery} placeholder="Search products" onSubmit={() => { setSearch(query.trim()); setPage(1); }} /><select aria-label="Sort products" value={sort} onChange={event => { setSort(event.target.value); setPage(1); }} className="input-field min-h-11 rounded-lg py-2 sm:w-auto"><option value="newest">Newest first</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select>{search && <button type="button" className="admin-secondary" onClick={() => { setQuery(''); setSearch(''); setPage(1); }}>Clear search</button>}</div>
      {error ? <div className="p-5"><AdminNotice onRetry={() => setRefresh(value => value + 1)}>{error}</AdminNotice></div> : loading ? <div className="py-16"><Loader /></div> : products.length === 0 ? <AdminEmpty title={search || featured ? 'No matching products' : 'Your collection starts here'} description={search || featured ? 'Try a different search or view all products.' : 'Add your first product to bring your storefront to life.'}><Link to="/admin/products/new" className="admin-primary">Add product</Link></AdminEmpty> : <>
        <div className="grid grid-cols-1 gap-4 bg-[#fafbf8] p-4 md:grid-cols-2 xl:hidden">{products.map(product => <article key={product.id} className="rounded-xl border border-sand bg-white p-4"><div className="flex gap-4">{photo(product)}<div className="min-w-0"><p className="mb-1 text-[10px] uppercase tracking-wider text-muted">{product.category_name || 'Uncategorised'}</p><Link to={`/admin/products/${product.id}/edit`} state={{ product }} className="text-sm font-semibold">{product.name}</Link><p className="mt-2 text-sm font-semibold">{money(product.discount_price || product.price)}</p></div></div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-sand pt-3"><div>{stock(product)}<p className="mt-1 text-[10px] text-muted">{product.stock} available</p></div>{actions(product)}</div></article>)}</div>
        <div className="hidden overflow-x-auto xl:block"><table className="admin-table"><thead><tr><th scope="col">Product</th><th scope="col">Category</th><th scope="col">Price</th><th scope="col">Inventory</th><th scope="col">Actions</th></tr></thead><tbody>{products.map(product => <tr key={product.id}><td><div className="flex items-center gap-3">{photo(product)}<div className="max-w-xs"><Link to={`/admin/products/${product.id}/edit`} state={{ product }} className="text-sm font-semibold hover:text-accent">{product.name}</Link><p className="mt-1 text-[11px] text-muted">{product.brand || 'Koorm'}{Boolean(product.is_featured) && ' · Featured'}</p></div></div></td><td className="text-xs text-muted">{product.category_name || 'Uncategorised'}</td><td className="whitespace-nowrap font-semibold">{money(product.discount_price || product.price)}</td><td>{stock(product)}<p className="mt-1 text-[11px] text-muted">{product.stock} available</p></td><td>{actions(product)}</td></tr>)}</tbody></table></div>
        <AdminPagination page={page} pages={pages} total={total} count={products.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </>}
    </section>
    <AdminConfirm item={deleteTarget} busy={deleting} error={deleteError} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />
  </AdminLayout>;
}
