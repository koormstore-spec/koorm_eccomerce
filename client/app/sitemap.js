import { getAllProductSlugs } from '../src/api/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5173';

export const revalidate = 3600;

export default async function sitemap() {
  const staticRoutes = ['', '/shop', '/about', '/contact'].map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.7,
  }));
  const productRoutes = (await getAllProductSlugs({ revalidate })).map((slug) => ({
    url: `${SITE_URL}/product/${slug}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));
  return [...staticRoutes, ...productRoutes];
}
