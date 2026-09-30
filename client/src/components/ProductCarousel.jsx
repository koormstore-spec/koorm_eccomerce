import { useEffect, useId, useRef, useState } from 'react';
import ProductCard from './ProductCard';
import { ChevronRightIcon } from './Icons';

export default function ProductCarousel({ products, label = 'You may also like' }) {
  const track = useRef(null);
  const trackId = useId();
  const [canPrevious, setCanPrevious] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const update = () => {
      setCanPrevious(element.scrollLeft > 2);
      setCanNext(element.scrollLeft + element.clientWidth < element.scrollWidth - 2);
    };
    update();
    element.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const observer = window.ResizeObserver ? new ResizeObserver(update) : null;
    observer?.observe(element);
    return () => {
      element.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      observer?.disconnect();
    };
  }, [products.length]);

  const move = direction => {
    const element = track.current;
    if (!element) return;
    const cardWidth = element.firstElementChild?.getBoundingClientRect().width || element.clientWidth;
    const gap = parseFloat(getComputedStyle(element).columnGap) || 0;
    element.scrollBy({ left: direction * (cardWidth + gap), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };

  if (!products.length) return null;
  return (
    <div className="product-carousel" role="region" aria-label={label} aria-roledescription="carousel">
      <div className="product-carousel-controls">
        <button type="button" aria-label="Previous products" aria-controls={trackId} disabled={!canPrevious} onClick={() => move(-1)}><ChevronRightIcon width={15} height={15} className="rotate-180" aria-hidden="true" /></button>
        <button type="button" aria-label="Next products" aria-controls={trackId} disabled={!canNext} onClick={() => move(1)}><ChevronRightIcon width={15} height={15} aria-hidden="true" /></button>
      </div>
      <div id={trackId} ref={track} className="product-carousel-track" tabIndex={0} role="group" aria-label="Scrollable products" onKeyDown={event => {
        if (event.target !== event.currentTarget || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        move(event.key === 'ArrowLeft' ? -1 : 1);
      }}>
        {products.map(product => <ProductCard key={product.id} product={product} />)}
      </div>
    </div>
  );
}
