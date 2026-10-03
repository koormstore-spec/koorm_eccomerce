// Stand-in for next/image in tests: a plain <img> with the original src, so
// assertions about which photo is shown don't depend on /_next/image URLs.
export default function Image({ priority, preload, unoptimized, fill, sizes, quality, placeholder, blurDataURL, loader, ...props }) {
  return <img {...props} />;
}
