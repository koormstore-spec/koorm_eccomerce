// A visitor who taps "Add to bag" while logged out is sent to login. We hold on
// to what they were adding so that, once they are back, they land on that same
// product and the piece drops into their bag by itself.
const KEY = 'koorm_pending_cart';
const MAX_AGE_MS = 30 * 60 * 1000;

export const savePendingAdd = (intent) => {
  if (!intent?.slug) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...intent, savedAt: Date.now() }));
  } catch {
    // Storage can be unavailable (private mode, blocked cookies). The login
    // redirect still works — it just will not re-add on its own.
  }
};

export const readPendingAdd = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const intent = JSON.parse(raw);
    if (!intent?.slug || Date.now() - intent.savedAt > MAX_AGE_MS) {
      clearPendingAdd();
      return null;
    }
    return intent;
  } catch {
    return null;
  }
};

export const clearPendingAdd = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clean up */
  }
};

// Where to send someone after they authenticate, when no explicit `from`
// location was carried through the login flow.
export const pendingAddPath = () => {
  const intent = readPendingAdd();
  return intent ? `/product/${intent.slug}` : null;
};
