import { useState } from 'react';
import { testRouter } from './next-navigation';

export { testRouter };

// Drop-in for react-router's <MemoryRouter> in tests: sets the in-memory
// location (and route params) before the children first render.
export function MemoryRouter({ initialEntries = ['/'], params = {}, children }) {
  useState(() => testRouter.reset(initialEntries[0], params));
  return children;
}
