import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../../api/adminAxios';
import AdminLayout from '../../components/AdminLayout';
import Loader from '../../components/Loader';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminApi.get('/admin/stats').then(({ data }) => setStats(data));
  }, []);

  return (
    <AdminLayout>
      {!stats ? (
        <Loader />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <StatCard label="Total Orders" value={stats.totalOrders} />
            <StatCard label="Revenue" value={`₹${Number(stats.totalRevenue).toLocaleString('en-IN')}`} />
            <StatCard label="Products" value={stats.totalProducts} />
            <StatCard label="Customers" value={stats.totalCustomers} />
          </div>

          <h2 className="font-serif text-xl mb-4">Recent Orders</h2>
          <div className="border border-sand divide-y divide-sand">
            {stats.recentOrders.map((o) => (
              <Link key={o.id} to="/admin/orders" className="flex items-center justify-between px-5 py-3 hover:bg-cream text-sm">
                <span>{o.order_number}</span>
                <span className="text-ink/60">{o.customer_name}</span>
                <span className="capitalize">{o.status}</span>
                <span className="font-medium">₹{Number(o.total_amount).toLocaleString('en-IN')}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="border border-sand p-5">
      <p className="text-xs uppercase tracking-wide text-ink/50 mb-2">{label}</p>
      <p className="text-2xl font-serif font-semibold">{value}</p>
    </div>
  );
}
