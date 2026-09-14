import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import api from '../api/axios';
import Loader from '../components/Loader';

const STATUS_COLORS = {
  placed: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const load = () => {
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data)).finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const cancelOrder = async () => {
    setCancelling(true);
    try {
      await api.put(`/orders/${id}/cancel`);
      load();
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <Loader full />;
  if (!order) return <p className="container-x py-20 text-center">Order not found.</p>;

  const canCancel = ['placed', 'processing'].includes(order.status);

  return (
    <div className="container-x py-10 max-w-3xl mx-auto fade-in">
      {location.state?.justPlaced && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-5 py-4 mb-8 text-center">
          🎉 Order placed successfully! You'll pay ₹{Number(order.total_amount).toLocaleString('en-IN')} on delivery.
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl">{order.order_number}</h1>
          <p className="text-muted text-sm mt-1">
            Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full capitalize ${STATUS_COLORS[order.status]}`}>{order.status}</span>
      </div>

      <div className="border border-sand p-4 sm:p-6 mb-6">
        <h2 className="font-medium mb-4">Items</h2>
        <div className="divide-y divide-sand">
          {order.items.map((item) => (
            <div key={item.id} className="grid grid-cols-[4rem_minmax(0,1fr)] gap-x-4 gap-y-2 py-3 sm:flex">
              <div className="h-20 w-16 bg-sand/40 overflow-hidden shrink-0">
                {item.product_image && <img src={item.product_image} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{item.product_name}</p>
                <p className="text-xs text-muted">Size: {item.size} · Qty: {item.quantity}</p>
              </div>
              <p className="col-start-2 font-medium text-sm">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-sand mt-4 pt-4 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>₹{Number(order.items_total).toLocaleString('en-IN')}</span></div>
          {Number(order.discount_amount) > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Coupon {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
              <span>&minus;₹{Number(order.discount_amount).toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between"><span className="text-muted">Shipping</span><span>{Number(order.shipping_fee) === 0 ? 'Free' : `₹${order.shipping_fee}`}</span></div>
          <div className="flex justify-between font-semibold text-base pt-2 border-t border-sand"><span>Total (COD)</span><span>₹{Number(order.total_amount).toLocaleString('en-IN')}</span></div>
        </div>
      </div>

      <div className="border border-sand p-6 mb-6">
        <h2 className="font-medium mb-2">Shipping Address</h2>
        <p className="text-sm text-muted leading-relaxed">
          {order.shipping_name} · {order.shipping_phone}<br />
          {order.shipping_address_line1}{order.shipping_address_line2 ? `, ${order.shipping_address_line2}` : ''}<br />
          {order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link to="/profile" className="btn-outline">Back to Orders</Link>
        {canCancel && (
          <button onClick={cancelOrder} disabled={cancelling} className="btn-outline text-red-600 border-red-300 hover:bg-red-600 hover:text-white">
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
      </div>
    </div>
  );
}
