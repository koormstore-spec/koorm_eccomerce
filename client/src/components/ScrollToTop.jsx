import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// `html { scroll-behavior: smooth }` makes an in-page jump pleasant but turns
// every route change into a long animated scroll through the whole document.
// Jumping instantly here keeps navigation feeling immediate.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
