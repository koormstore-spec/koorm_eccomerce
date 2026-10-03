'use client';

import { useId } from 'react';
import { Link } from '../lib/router';
import OptimizedImage from './OptimizedImage';

export default function MembershipBanner({ className = '' }) {
  const headingId = useId();

  return (
    <section className={`membership-banner ${className}`} aria-labelledby={headingId}>
      <OptimizedImage src="/images/collection-26/white-grey-cotton-shirt/1.jpg" alt="White cotton shirt from the collection" width={1200} height={1600} sizes="(max-width: 768px) 50vw, 25vw" />
      <div>
        <h2 id={headingId} className="reference-heading">Good style starts<br />with the essentials</h2>
        <p>Discover considered fabrics, timeless colours,<br className="hidden sm:block" /> and your next favourite shirt.</p>
        <Link to="/register" className="campaign-button campaign-button-dark">Join Koorm</Link>
        <Link to="/shop" className="membership-link">Explore the collection</Link>
      </div>
      <OptimizedImage src="/images/collection-26/sand-beige-linen-shirt/1.jpg" alt="Beige linen shirt from the collection" width={1200} height={1600} sizes="(max-width: 768px) 50vw, 25vw" />
    </section>
  );
}
