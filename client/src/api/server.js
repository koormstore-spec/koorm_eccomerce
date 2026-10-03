import { SERVER_API_URL } from './config';

// Server-side reads for public catalogue pages. Never throws: if the API is
// unreachable (e.g. during `next build` without the API running) callers get
// `data: null` and the page falls back to fetching in the browser.
export async function getFromApi(path, { revalidate = 60 } = {}) {
  try {
    const res = await fetch(`${SERVER_API_URL}${path}`, { next: { revalidate } });
    if (!res.ok) return { status: res.status, data: null };
    return { status: res.status, data: await res.json() };
  } catch {
    return { status: 0, data: null };
  }
}

// Every product slug, paging through the API (it caps page size at 100).
export async function getAllProductSlugs({ revalidate = 60 } = {}) {
  const slugs = [];
  for (let page = 1; ; page += 1) {
    const { data } = await getFromApi(`/products?page=${page}&limit=100`, { revalidate });
    if (!data?.products?.length) break;
    slugs.push(...data.products.map((product) => product.slug));
    if (page >= data.pages) break;
  }
  return slugs;
}
