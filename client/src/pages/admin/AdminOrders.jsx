import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/adminAxios';
import AdminLayout from '../../components/AdminLayout';
import Loader from '../../components/Loader';
import { ReturnIcon } from '../../components/Icons';
import { AdminNotice, AdminEmpty, AdminSearch, AdminPagination, StatusBadge, ORDER_STATUSES, money, dateLabel } from '../../components/admin/AdminUI';

const PAGE_SIZE = 10;

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('search') || '';
  const filter = searchParams.get('status') || '';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState({});
  const [page, setPage] = useState(1);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const { data } = await api.get('/orders/admin/all'); setOrders(data); }
    catch { setError('We couldn’t load your orders. Please try again.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const updateFilter = (key, value) => { const next = new URLSearchParams(searchParams); if (value) next.set(key, value); else next.delete(key); setSearchParams(next, { replace: true }); setPage(1); };
  const filtered = orders.filter(order => (!filter || order.status === filter) && `${order.order_number} ${order.customer_name} ${order.customer_email}`.toLowerCase().includes(query.toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const changeStatus = async (order, status) => {
    setSaving(value => ({ ...value, [order.id]: true })); setError(''); setNotice('');
    try {
      await api.put(`/orders/admin/${order.id}/status`, { status });
      setOrders(value => value.map(item => item.id === order.id ? { ...item, status } : item));
      setNotice(`${order.order_number} is now ${status}.`);
    } catch (err) { setError(err.response?.data?.message || 'The order status could not be updated. Please try again.'); }
    finally { setSaving(value => ({ ...value, [order.id]: false })); }
  };
  const statusControl = order => <label className="block text-[10px] font-medium text-muted">{saving[order.id] ? 'Saving status…' : 'Update status'}<select aria-label={`Status for ${order.order_number}`} disabled={saving[order.id]} value={order.status} onChange={event => changeStatus(order, event.target.value)} className="input-field mt-1 min-h-11 rounded-lg px-3 py-2 text-xs capitalize disabled:opacity-50">{ORDER_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}</select></label>;

  return <AdminLayout title="Customer orders" description="From the first order to the doorstep. Keep every customer up to date." actions={<button type="button" onClick={load} disabled={loading || Object.values(saving).some(Boolean)} className="admin-secondary"><ReturnIcon width={15} height={15} />Refresh orders</button>}>
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{[{ label: 'All orders', count: orders.length }, { label: 'To prepare', count: orders.filter(order => ['placed', 'processing'].includes(order.status)).length }, { label: 'Shipped', count: orders.filter(order => order.status === 'shipped').length }, { label: 'Delivered', count: orders.filter(order => order.status === 'delivered').length }].map(item => <div key={item.label} className="admin-stat"><p className="text-xs text-muted">{item.label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{loading ? '—' : item.count}</p></div>)}</div>
    {error && <div className="mb-5"><AdminNotice onRetry={!orders.length ? load : undefined}>{error}</AdminNotice></div>}
    {notice && <div className="mb-5"><AdminNotice success>{notice}</AdminNotice></div>}
    <section className="admin-panel"><div className="flex flex-col gap-3 border-b border-sand p-4 sm:flex-row sm:px-6"><AdminSearch value={query} onChange={value => updateFilter('search', value)} placeholder="Search orders or customers" /><select aria-label="Filter order status" value={filter} onChange={event => updateFilter('status', event.target.value)} className="input-field min-h-11 rounded-lg py-2 sm:w-auto"><option value="">All statuses</option>{ORDER_STATUSES.map(status => <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>)}</select>{(query || filter) && <button type="button" className="admin-secondary" onClick={() => { setSearchParams({}); setPage(1); }}>Clear filters</button>}</div>
      {loading ? <div className="py-16"><Loader /></div> : !orders.length && error ? null : !visible.length ? <AdminEmpty title={orders.length ? 'No matching orders' : 'No orders just yet'} description={orders.length ? 'Try another order number, customer, or status.' : 'New customer orders will appear here, ready for you to manage.'} /> : <>
        <div className="grid grid-cols-1 gap-4 bg-[#fafbf8] p-4 md:grid-cols-2 xl:hidden">{visible.map(order => <article key={order.id} className="rounded-xl border border-sand bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h2 className="text-xs font-semibold">{order.order_number}</h2><p className="mt-1 text-[11px] text-muted">{dateLabel(order.created_at)}</p></div><StatusBadge status={order.status} /></div><div className="my-4 border-y border-sand py-4"><p className="text-sm font-medium">{order.customer_name}</p><p className="mt-1 text-xs text-muted">{order.customer_email}</p><p className="mt-3 text-lg font-semibold">{money(order.total_amount)} <span className="ml-1 text-[10px] font-normal text-muted">Cash on delivery</span></p></div>{statusControl(order)}</article>)}</div>
        <div className="hidden overflow-x-auto xl:block"><table className="admin-table"><thead><tr><th scope="col">Order</th><th scope="col">Customer</th><th scope="col">Total</th><th scope="col">Status</th><th scope="col">Manage</th></tr></thead><tbody>{visible.map(order => <tr key={order.id}><td><p className="text-xs font-semibold">{order.order_number}</p><p className="mt-1 text-[11px] text-muted">{dateLabel(order.created_at)}</p></td><td><p className="text-sm font-medium">{order.customer_name}</p><p className="mt-1 max-w-[16rem] text-xs text-muted">{order.customer_email}</p></td><td className="whitespace-nowrap font-semibold">{money(order.total_amount)}</td><td><StatusBadge status={order.status} /></td><td className="min-w-[10rem]">{statusControl(order)}</td></tr>)}</tbody></table></div>
        <AdminPagination page={currentPage} pages={pages} total={filtered.length} count={visible.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </>}
    </section>
  </AdminLayout>;
}
