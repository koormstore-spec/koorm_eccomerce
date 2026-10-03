'use client';

// The react-router APIs this app used, re-implemented on next/navigation so
// existing components only needed their import path changed.
import NextLink from 'next/link';
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams,
} from 'next/navigation';
import { useCallback, useMemo } from 'react';

// react-router keeps `location.state` alongside each history entry; Next.js
// has no equivalent, so remember the state handed to the most recent
// navigation and expose it only while that destination is the current page.
let pendingState = { path: null, state: null };

const pathOf = (to) => {
  const url = new URL(to, 'http://localhost');
  return url.pathname;
};

const rememberState = (to, state) => {
  pendingState = state === undefined ? { path: null, state: null } : { path: pathOf(to), state };
};

export function Link({ to, state, onClick, ...props }) {
  return (
    <NextLink
      href={to}
      onClick={(event) => {
        rememberState(to, state);
        onClick?.(event);
      }}
      {...props}
    />
  );
}

export function NavLink({ to, end = false, className = '', ...props }) {
  const pathname = usePathname();
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  const resolvedClass = typeof className === 'function'
    ? className({ isActive })
    : [className, isActive && 'active'].filter(Boolean).join(' ');
  return <Link to={to} className={resolvedClass} aria-current={isActive ? 'page' : undefined} {...props} />;
}

export function useNavigate() {
  const router = useRouter();
  return useCallback((to, options = {}) => {
    if (typeof to === 'number') {
      if (to < 0) router.back();
      else router.forward();
      return;
    }
    rememberState(to, options.state);
    if (options.replace) router.replace(to);
    else router.push(to);
  }, [router]);
}

// Deliberately excludes the query string: reading search params opts a
// statically rendered page out of server rendering, so only the few
// components that need it call useSearchParams directly.
export function useLocation() {
  const pathname = usePathname() ?? '/';
  const state = pendingState.path === pathname ? pendingState.state : null;
  return useMemo(() => ({ pathname, state }), [pathname, state]);
}

export function useParams() {
  return useNextParams() ?? {};
}

export function useSearchParams() {
  const searchParams = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const setSearchParams = useCallback((next, options = {}) => {
    const query = new URLSearchParams(next).toString();
    const href = query ? `${pathname}?${query}` : pathname;
    // react-router's setSearchParams never scrolled; keep that behaviour.
    if (options.replace) router.replace(href, { scroll: false });
    else router.push(href, { scroll: false });
  }, [pathname, router]);
  return [searchParams, setSearchParams];
}
