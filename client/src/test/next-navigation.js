// In-memory stand-in for next/navigation (aliased in vitest.config.js), so
// components using the app's router helpers can render outside Next.js.
import { useMemo, useSyncExternalStore } from 'react';

let current = { pathname: '/', search: '', params: {} };
const listeners = new Set();
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const emit = () => listeners.forEach((listener) => listener());

const go = (href) => {
  const url = new URL(href, `http://localhost${current.pathname}`);
  current = { ...current, pathname: url.pathname, search: url.search };
  testRouter.history.push(url.pathname + url.search);
  emit();
};

export const testRouter = {
  history: [],
  reset(path = '/', params = {}) {
    const url = new URL(path, 'http://localhost');
    current = { pathname: url.pathname, search: url.search, params };
    testRouter.history = [];
  },
  get location() {
    return { pathname: current.pathname, search: current.search };
  },
};

const router = { push: go, replace: go, back() {}, forward() {}, prefetch() {}, refresh() {} };

export function useRouter() {
  return router;
}

export function usePathname() {
  return useSyncExternalStore(subscribe, () => current.pathname);
}

export function useSearchParams() {
  const search = useSyncExternalStore(subscribe, () => current.search);
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function useParams() {
  return useSyncExternalStore(subscribe, () => current.params);
}

export function notFound() {
  throw new Error('NEXT_NOT_FOUND');
}

export function redirect(href) {
  go(href);
}
