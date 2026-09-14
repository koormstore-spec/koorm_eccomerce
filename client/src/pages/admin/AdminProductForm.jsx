import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import adminApi from '../../api/adminAxios';
import AdminLayout from '../../components/AdminLayout';

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  price: '',
  discount_price: '',
  category_id: '',
  brand: 'Koorm',
  gender: 'unisex',
  sizes: '',
  colors: '',
  images: '',
  stock: 100,
  is_featured: false,
};

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data));
    if (isEdit) {
      api.get('/products', { params: { limit: 100 } }).then(({ data }) => {
        const product = data.products.find((p) => String(p.id) === id);
        if (product) {
          setForm({
            ...product,
            sizes: (product.sizes || []).join(', '),
            colors: (product.colors || []).join(', '),
            images: (product.images || []).join(', '),
            category_id: product.category_id || '',
          });
        }
      });
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const autoSlug = (e) => {
    const name = e.target.value;
    setForm((f) => ({
      ...f,
      name,
      slug: f.slug || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price),
      discount_price: form.discount_price ? Number(form.discount_price) : null,
      category_id: form.category_id ? Number(form.category_id) : null,
      stock: Number(form.stock),
      sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      colors: form.colors.split(',').map((s) => s.trim()).filter(Boolean),
      images: form.images.split(',').map((s) => s.trim()).filter(Boolean),
      is_featured: Boolean(form.is_featured),
    };
    try {
      if (isEdit) {
        await adminApi.put(`/products/${id}`, payload);
      } else {
        await adminApi.post('/products', payload);
      }
      navigate('/admin/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <h2 className="font-serif text-xl mb-6">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <input name="name" value={form.name} onChange={autoSlug} required placeholder="Product Name" className="input-field" />
        <input name="slug" value={form.slug} onChange={handleChange} required placeholder="url-slug" className="input-field" />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" rows={3} className="input-field" />

        <div className="grid grid-cols-2 gap-4">
          <input name="price" type="number" value={form.price} onChange={handleChange} required placeholder="Price (₹)" className="input-field" />
          <input name="discount_price" type="number" value={form.discount_price || ''} onChange={handleChange} placeholder="Discount Price (optional)" className="input-field" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <select name="category_id" value={form.category_id} onChange={handleChange} className="input-field">
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select name="gender" value={form.gender} onChange={handleChange} className="input-field">
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="kids">Kids</option>
            <option value="unisex">Unisex</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input name="brand" value={form.brand} onChange={handleChange} placeholder="Brand" className="input-field" />
          <input name="stock" type="number" value={form.stock} onChange={handleChange} placeholder="Stock" className="input-field" />
        </div>

        <input name="sizes" value={form.sizes} onChange={handleChange} placeholder="Sizes (comma separated, e.g. S, M, L, XL)" className="input-field" />
        <input name="colors" value={form.colors} onChange={handleChange} placeholder="Colors (comma separated)" className="input-field" />
        <input name="images" value={form.images} onChange={handleChange} placeholder="Image URLs (comma separated)" className="input-field" />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_featured" checked={Boolean(form.is_featured)} onChange={handleChange} />
          Mark as featured (shown on homepage)
        </label>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <button type="button" onClick={() => navigate('/admin/products')} className="btn-outline">Cancel</button>
        </div>
      </form>
    </AdminLayout>
  );
}
