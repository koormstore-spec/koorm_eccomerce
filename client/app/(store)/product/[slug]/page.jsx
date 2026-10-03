import { notFound } from 'next/navigation';
import ProductDetail from '../../../../src/views/ProductDetail';
import { getAllProductSlugs, getFromApi } from '../../../../src/api/server';

export const revalidate = 60;

// Pre-build every current product at deploy time; products added later are
// rendered on their first visit and cached the same way.
export async function generateStaticParams() {
  return (await getAllProductSlugs()).map((slug) => ({ slug }));
}

// Next.js memoises identical fetches within a request, so generateMetadata
// and the page share a single API call.
const getProduct = (slug) => getFromApi(`/products/${encodeURIComponent(slug)}`);

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { data: product } = await getProduct(slug);
  if (!product) return { title: 'Product not found' };
  const description = product.description?.slice(0, 160);
  const image = product.images?.[0];
  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      url: `/product/${product.slug}`,
      images: image ? [{ url: image, width: 1000, height: 1333, alt: product.name }] : [],
    },
  };
}

const productJsonLd = (product) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  image: product.images,
  brand: { '@type': 'Brand', name: product.brand || 'Koorm' },
  offers: {
    '@type': 'Offer',
    priceCurrency: 'INR',
    price: Number(product.discount_price || product.price),
    availability: Number(product.stock) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
  },
  ...(Number(product.num_reviews) > 0 && {
    aggregateRating: { '@type': 'AggregateRating', ratingValue: Number(product.rating), reviewCount: Number(product.num_reviews) },
  }),
});

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const { status, data: product } = await getProduct(slug);
  if (status === 404) notFound();

  // status 0 / 5xx: the API was unreachable while rendering — let the page
  // fetch in the browser (and show its own retry UI) instead of failing.
  return (
    <>
      {product && (
        <script
          type="application/ld+json"
          // JSON.stringify output is data, not markup; escape '<' so a product
          // description can never close the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)).replace(/</g, '\\u003c') }}
        />
      )}
      <ProductDetail initialProduct={product} />
    </>
  );
}
