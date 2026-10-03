import Shop from '../../../src/views/Shop';
import { getFromApi } from '../../../src/api/server';

export const metadata = {
  title: 'Shop men’s shirts',
  description: 'Browse the Koorm collection of cotton, linen, oxford and twill shirts.',
};

// Rebuilds the query string exactly as the browser's URLSearchParams would,
// so Shop can tell the server-rendered results match its current URL.
const toQueryString = (searchParams) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    for (const item of [].concat(value)) params.append(key, item);
  }
  return params.toString();
};

export default async function ShopPage({ searchParams }) {
  const query = toQueryString(await searchParams);
  const params = new URLSearchParams(query);
  params.set('page', String(Math.max(1, Number(params.get('page')) || 1)));
  params.set('limit', '12');

  const [{ data }, { data: filters }] = await Promise.all([
    getFromApi(`/products?${params}`),
    getFromApi('/products/filters'),
  ]);
  const initialData = data ? { query, products: data.products, pages: data.pages, total: data.total } : null;
  return <Shop initialData={initialData} initialColors={filters?.colors ?? null} />;
}
