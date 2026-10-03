import Home from '../../src/views/Home';
import { getFromApi } from '../../src/api/server';

export const revalidate = 60;

export default async function HomePage() {
  const { data } = await getFromApi('/products?limit=8&sort=newest');
  return <Home initialFeatured={data?.products ?? null} />;
}
