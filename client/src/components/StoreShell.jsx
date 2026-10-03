'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Navbar, { NavbarView } from './Navbar';
import Footer from './Footer';

export default function StoreShell({ children }) {
  const pathname = usePathname() ?? '';
  const productPage = pathname.startsWith('/product/');
  return (
    <div className={`storefront flex flex-col min-h-screen ${productPage ? 'product-detail-page pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0' : ''}`}>
      <Suspense fallback={<NavbarView />}>
        <Navbar />
      </Suspense>
      <main className="min-w-0 flex-1">{children}</main>
      <Footer />
    </div>
  );
}
