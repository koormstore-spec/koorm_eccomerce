// Stand-in for next/link in tests: a plain anchor that navigates the
// in-memory router from ./next-navigation.js.
import { useRouter } from 'next/navigation';

export default function Link({ href, replace, scroll, prefetch, onClick, children, ...props }) {
  const router = useRouter();
  return (
    <a
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        (replace ? router.replace : router.push)(href);
      }}
      {...props}
    >
      {children}
    </a>
  );
}
