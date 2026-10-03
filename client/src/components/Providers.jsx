'use client';

import { AdminAuthProvider } from '../context/AdminAuthContext';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';

export default function Providers({ children }) {
  return (
    <AdminAuthProvider>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </AdminAuthProvider>
  );
}
