import { Suspense } from 'react';
import { AdminRoute } from '../../../src/components/PrivateRoute';
import Loader from '../../../src/components/Loader';

export default function ProtectedAdminLayout({ children }) {
  return (
    <AdminRoute>
      {/* AdminOrders reads the query string, which needs a Suspense boundary. */}
      <Suspense fallback={<Loader full />}>{children}</Suspense>
    </AdminRoute>
  );
}
