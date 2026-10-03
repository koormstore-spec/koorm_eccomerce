'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // The saved session lives in localStorage, which the server can't see, so
  // it's loaded after mount. `ready` lets guards wait for it instead of
  // treating a signed-in customer as signed out on the first render.
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('koorm_user');
      if (stored) setUser(JSON.parse(stored));
    } catch {
      localStorage.removeItem('koorm_user');
    }
    setReady(true);
  }, []);

  const setSession = (data) => {
    localStorage.setItem('koorm_user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  // Step 1 of registration: submit details, get an emailed code.
  const register = async (name, email, phone) => {
    const { data } = await api.post('/auth/register', { name, email, phone });
    return data;
  };

  // Step 2 of registration: the code matching completes account creation
  // and logs the user in immediately.
  const verifyEmail = async (email, code) => {
    const { data } = await api.post('/auth/verify-email', { email, code });
    return setSession(data);
  };

  const resendVerificationCode = async (email) => {
    const { data } = await api.post('/auth/resend-verification', { email });
    return data;
  };

  // Step 1 of login: email a code to an already-verified account.
  const requestLoginCode = async (email) => {
    const { data } = await api.post('/auth/request-login-code', { email });
    return data;
  };

  // Step 2 of login: the matching code logs the user in.
  const verifyLoginCode = async (email, code) => {
    const { data } = await api.post('/auth/verify-login-code', { email, code });
    return setSession(data);
  };

  const logout = () => {
    localStorage.removeItem('koorm_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        register,
        verifyEmail,
        resendVerificationCode,
        requestLoginCode,
        verifyLoginCode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
