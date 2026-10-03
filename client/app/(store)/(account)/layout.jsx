import { PrivateRoute } from '../../../src/components/PrivateRoute';

export const metadata = { robots: { index: false } };

export default function AccountLayout({ children }) {
  return <PrivateRoute>{children}</PrivateRoute>;
}
