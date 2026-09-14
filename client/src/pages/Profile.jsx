import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

const STATUS_COLORS = {
  placed: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function Profile() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders').then(({ data }) => setOrders(data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="container-x py-10 fade-in">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1 className="section-title">My Account</h1>
          <p className="text-muted text-sm mt-2">{user.name} · {user.email}</p>
        </div>
        <button onClick={logout} className="btn-outline text-xs py-2">Logout</button>
      </div>

      <h2 className="font-serif text-xl mb-4">Order History</h2>
      {loading ? (
        <Loader />
      ) : orders.length === 0 ? (
        <div className="text-center py-16 border border-sand">
          <p className="text-muted mb-4">You haven't placed any orders yet.</p>
          <Link to="/shop" className="btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="flex flex-col items-start justify-between gap-4 border border-sand p-5 hover:border-ink transition sm:flex-row sm:items-center"
            >
              <div>
                <p className="font-medium">{order.order_number}</p>
                <p className="text-sm text-muted">
                  {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' · '}{order.items.length} item{order.items.length > 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span className={`text-xs px-3 py-1 rounded-full capitalize ${STATUS_COLORS[order.status]}`}>
                  {order.status}
                </span>
                <p className="font-semibold">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
