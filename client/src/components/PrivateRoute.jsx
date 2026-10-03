'use client';

import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useLocation, useNavigate } from '../lib/router';
import Loader from './Loader';

// The saved session loads after mount, so wait for `ready` before deciding a
// visitor is signed out — otherwise a refresh would bounce them to login.
export function PrivateRoute({ children }) {
  const { user, ready } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !user) navigate('/login', { replace: true, state: { from: { pathname } } });
  }, [ready, user, pathname, navigate]);

  if (!ready || !user) return <Loader full />;
  return children;
}

export function AdminRoute({ children }) {
  const { admin, ready } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !admin) navigate('/admin/login', { replace: true });
  }, [ready, admin, navigate]);

  if (!ready || !admin) return <Loader full />;
  return children;
}
