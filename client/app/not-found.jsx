import StoreShell from '../src/components/StoreShell';
import NotFound from '../src/views/NotFound';

export const metadata = { title: 'Page not found' };

export default function NotFoundPage() {
  return (
    <StoreShell>
      <NotFound />
    </StoreShell>
  );
}
