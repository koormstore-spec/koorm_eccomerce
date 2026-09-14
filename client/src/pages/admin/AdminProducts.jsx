import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import adminApi from '../../api/adminAxios';
import AdminLayout from '../../components/AdminLayout';
import Loader from '../../components/Loader';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/products', { params: { limit: 100 } }).then(({ data }) => setProducts(data.products)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await adminApi.delete(`/products/${id}`);
    load();
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl">Products ({products.length})</h2>
        <Link to="/admin/products/new" className="btn-primary text-xs py-2">+ Add Product</Link>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="border border-sand overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sand/30 text-left">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 flex items-center gap-3">
                    <img src={p.images?.[0]} alt="" className="h-10 w-8 object-cover" />
                    {p.name}
                  </td>
                  <td className="px-4 py-3 capitalize">{p.category_name || '—'}</td>
                  <td className="px-4 py-3">₹{Number(p.discount_price || p.price).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3 space-x-3">
                    <Link to={`/admin/products/${p.id}/edit`} className="text-clay hover:underline">Edit</Link>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">Delete</button>
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
