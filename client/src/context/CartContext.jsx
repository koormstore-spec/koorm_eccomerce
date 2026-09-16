import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import { flyToBag } from '../utils/flyToBag';

const CartContext = createContext(null);

export const FREE_SHIPPING_THRESHOLD = 1999;
export const SHIPPING_FEE = 99;

const COUPON_STORAGE_KEY = 'koorm_coupon';

const readStoredCoupon = () => {
  try {
    return localStorage.getItem(COUPON_STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

const writeStoredCoupon = (code) => {
  try {
    if (code) localStorage.setItem(COUPON_STORAGE_KEY, code);
    else localStorage.removeItem(COUPON_STORAGE_KEY);
  } catch {
    /* storage unavailable — the coupon simply will not survive a reload */
  }
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  // True once the bag has been fetched at least once. Later refreshes (a
  // quantity tweak, a removal) must not throw the page back to a spinner.
  const [hydrated, setHydrated] = useState(false);
  // The most recent successful add, used to drive the confirmation toast.
  const [lastAdded, setLastAdded] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setHydrated(true);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/cart');
      setCartItems(data);
    } finally {
      setLoading(false);
      setHydrated(true);
    }
  }, [user]);

  const refreshWishlist = useCallback(async () => {
    if (!user) {
      setWishlist([]);
      return;
    }
    const { data } = await api.get('/wishlist');
    setWishlist(data);
  }, [user]);

  useEffect(() => {
    refreshCart();
    refreshWishlist();
  }, [refreshCart, refreshWishlist]);

  // `meta` is presentation only: it feeds the flying thumbnail and the toast.
  const addToCart = async (productId, size, quantity = 1, meta = {}) => {
    // Started before the round-trip so the bag reacts the instant you tap.
    if (meta.image) flyToBag(meta.originEl, meta.image);
    await api.post('/cart', { product_id: productId, size, quantity });
    await refreshCart();
    setLastAdded({
      productId,
      size,
      quantity,
      name: meta.name || '',
      image: meta.image || '',
      slug: meta.slug || '',
      at: Date.now(),
    });
  };

  const dismissLastAdded = useCallback(() => setLastAdded(null), []);

  const updateQuantity = async (cartItemId, quantity) => {
    await api.put(`/cart/${cartItemId}`, { quantity });
    await refreshCart();
  };

  const removeFromCart = async (cartItemId) => {
    await api.delete(`/cart/${cartItemId}`);
    await refreshCart();
  };

  const toggleWishlist = async (productId) => {
    const exists = wishlist.some((w) => w.id === productId);
    if (exists) {
      await api.delete(`/wishlist/${productId}`);
    } else {
      await api.post('/wishlist', { product_id: productId });
    }
    await refreshWishlist();
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + Number(item.discount_price || item.price) * item.quantity,
    0
  );

  const applyCoupon = useCallback(async (code) => {
    const normalized = (code || '').trim().toUpperCase();
    if (!normalized) return null;
    setCouponLoading(true);
    setCouponError('');
    try {
      const { data } = await api.post('/coupons/validate', { code: normalized });
      setAppliedCoupon(data);
      writeStoredCoupon(data.code);
      return data;
    } catch (err) {
      setAppliedCoupon(null);
      writeStoredCoupon('');
      setCouponError(err.response?.data?.message || 'Could not apply this coupon');
      return null;
    } finally {
      setCouponLoading(false);
    }
  }, []);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponError('');
    writeStoredCoupon('');
  }, []);

  // A discount is only ever valid against the bag it was quoted for, so any
  // change to the bag sends the code back to the server to be re-priced. The
  // ref makes sure each (code, total) pair is only ever checked once.
  const couponCheckRef = useRef('');
  useEffect(() => {
    const code = appliedCoupon?.code || readStoredCoupon();

    if (!user || !code || cartItems.length === 0) {
      couponCheckRef.current = '';
      if (appliedCoupon) setAppliedCoupon(null);
      if (!user || cartItems.length === 0) writeStoredCoupon('');
      return;
    }
    if (appliedCoupon && Number(appliedCoupon.items_total) === cartTotal) return;

    const checkKey = `${code}|${cartTotal}`;
    if (couponCheckRef.current === checkKey) return;
    couponCheckRef.current = checkKey;

    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.post('/coupons/validate', { code });
        if (cancelled) return;
        setAppliedCoupon(data);
        setCouponError('');
        writeStoredCoupon(data.code);
      } catch (err) {
        if (cancelled) return;
        setAppliedCoupon(null);
        writeStoredCoupon('');
        setCouponError(
          `${code} no longer applies — ${err.response?.data?.message || 'please try another code'}`
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, cartItems.length, cartTotal, appliedCoupon]);

  const cartDiscount = appliedCoupon ? Math.min(Number(appliedCoupon.discount_amount) || 0, cartTotal) : 0;
  // Delivery is judged on the bag value before any coupon, matching the server.
  const shippingFee = cartTotal === 0 || cartTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const cartPayable = Math.max(0, cartTotal - cartDiscount) + shippingFee;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        wishlist,
        loading,
        hydrated,
        cartCount,
        cartTotal,
        cartDiscount,
        shippingFee,
        cartPayable,
        lastAdded,
        dismissLastAdded,
        appliedCoupon,
        couponError,
        couponLoading,
        applyCoupon,
        removeCoupon,
        addToCart,
        updateQuantity,
        removeFromCart,
        toggleWishlist,
        refreshCart,
        refreshWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
