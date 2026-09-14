import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/cart');
      setCartItems(data);
    } finally {
      setLoading(false);
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

  const addToCart = async (productId, size, quantity = 1) => {
    await api.post('/cart', { product_id: productId, size, quantity });
    await refreshCart();
  };

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

  return (
    <CartContext.Provider
      value={{
        cartItems,
        wishlist,
        loading,
        cartCount,
        cartTotal,
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
