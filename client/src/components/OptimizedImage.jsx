import Image from 'next/image';

// next/image resizes and converts local images (/images/...) to AVIF/WebP on
// demand. Product images can also be external URLs pasted in by an admin,
// which Next.js won't optimise without allow-listing every host, so those are
// passed through untouched. Products without an image render nothing.
export default function OptimizedImage({ src, alt = '', ...props }) {
  if (!src) return null;
  return <Image src={src} alt={alt} unoptimized={!src.startsWith('/')} {...props} />;
}
