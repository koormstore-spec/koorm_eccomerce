const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5173';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/cart', '/checkout', '/profile', '/orders', '/wishlist', '/login', '/register', '/verify-email'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
