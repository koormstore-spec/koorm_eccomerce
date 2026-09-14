import { useEffect, useState } from 'react';
import api from '../../api/adminAxios';
import AdminLayout from '../../components/AdminLayout';
import Loader from '../../components/Loader';

const STATUSES = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/orders/admin/all').then(({ data }) => setOrders(data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const changeStatus = async (id, status) => {
    await api.put(`/orders/admin/${id}/status`, { status });
    load();
  };

  return (
    <AdminLayout>
      <h2 className="font-serif text-xl mb-6">Orders ({orders.length})</h2>
      {loading ? (
        <Loader />
      ) : (
        <div className="border border-sand overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sand/30 text-left">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3">{o.order_number}</td>
                  <td className="px-4 py-3">
                    <p>{o.customer_name}</p>
                    <p className="text-ink/50 text-xs">{o.customer_email}</p>
                  </td>
                  <td className="px-4 py-3 font-medium">₹{Number(o.total_amount).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-ink/60">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => changeStatus(o.id, e.target.value)}
                      className="input-field py-1.5 text-xs w-auto capitalize"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
