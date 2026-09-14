import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import api from '../api/axios';

vi.mock('../api/axios', () => ({
  default: { post: vi.fn() },
}));

function AuthProbe() {
  const { user, login, register, logout } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? user.email : 'anonymous'}</span>
      <button onClick={() => login('jane@example.com', 'secret123')}>login</button>
      <button onClick={() => register('Jane', 'jane@example.com', 'secret123', '999')}>register</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

const renderWithProvider = () =>
  render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>
  );

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('starts with no user when localStorage is empty', () => {
    renderWithProvider();
    expect(screen.getByTestId('user')).toHaveTextContent('anonymous');
  });

  it('restores the user from localStorage on mount', () => {
    localStorage.setItem('koorm_user', JSON.stringify({ id: 1, email: 'saved@example.com', token: 'abc' }));
    renderWithProvider();
    expect(screen.getByTestId('user')).toHaveTextContent('saved@example.com');
  });

  it('login stores the returned user in state and localStorage', async () => {
    api.post.mockResolvedValueOnce({ data: { id: 1, email: 'jane@example.com', token: 'tok-123' } });
    renderWithProvider();

    fireEvent.click(screen.getByText('login'));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('jane@example.com'));
    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'jane@example.com', password: 'secret123' });
    expect(JSON.parse(localStorage.getItem('koorm_user')).token).toBe('tok-123');
  });

  it('register stores the returned user in state and localStorage', async () => {
    api.post.mockResolvedValueOnce({ data: { id: 2, email: 'jane@example.com', token: 'tok-456' } });
    renderWithProvider();

    fireEvent.click(screen.getByText('register'));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('jane@example.com'));
    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      name: 'Jane',
      email: 'jane@example.com',
      password: 'secret123',
      phone: '999',
    });
  });

  it('logout clears both state and localStorage', async () => {
    localStorage.setItem('koorm_user', JSON.stringify({ id: 1, email: 'saved@example.com', token: 'abc' }));
    renderWithProvider();
    expect(screen.getByTestId('user')).toHaveTextContent('saved@example.com');

    fireEvent.click(screen.getByText('logout'));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('anonymous'));
    expect(localStorage.getItem('koorm_user')).toBeNull();
  });
});
