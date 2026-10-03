// NEXT_PUBLIC_* is inlined into the browser bundle at build time.
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Server components may reach the API over an internal address (e.g. the same
// host) that browsers can't; fall back to the public URL when it isn't set.
export const SERVER_API_URL = process.env.API_URL || API_URL;
