import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from '../test/router';
import Cart from './Cart';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../context/CartContext', () => ({ useCart: vi.fn() }));

const baseItem = { id: 1, product_id: 9, slug: 'linen-shirt', name: 'Linen shirt', brand: 'Koorm', size: 'M', price: 2000, discount_price: null, images: [], quantity: 1, stock: 5 };

let updateQuantity;
let removeFromCart;

const setup = (items) => {
  updateQuantity = vi.fn().mockResolvedValue(undefined);
  removeFromCart = vi.fn().mockResolvedValue(undefined);
  useAuth.mockReturnValue({ user: { id: 1 } });
  useCart.mockReturnValue({ cartItems: items, loading: false, cartTotal: items.reduce((s, i) => s + i.price * i.quantity, 0), updateQuantity, removeFromCart });
  return render(<MemoryRouter><Cart /></MemoryRouter>);
};

beforeEach(() => vi.clearAllMocks());

it('shows an out-of-stock badge and disables increasing quantity when stock has hit zero', () => {
  setup([{ ...baseItem, stock: 0 }]);
  expect(screen.getByText('Out of stock')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
});

it('shows an insufficient-stock badge when the cart quantity exceeds what is left', () => {
  setup([{ ...baseItem, quantity: 3, stock: 2 }]);
  expect(screen.getByText('Only 2 left in stock')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
});

it('disables increasing quantity once it reaches the stock limit, without showing the shortfall badge', () => {
  setup([{ ...baseItem, quantity: 2, stock: 2 }]);
  expect(screen.queryByText(/left in stock/)).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
});

it('increases quantity when stock allows it', () => {
  setup([{ ...baseItem, quantity: 1, stock: 5 }]);
  fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
  expect(updateQuantity).toHaveBeenCalledWith(1, 2);
});

it('disables increasing quantity and shows the limit badge once a product reaches the 4-item cap, even with stock to spare', () => {
  setup([{ ...baseItem, quantity: 4, stock: 50 }]);
  expect(screen.getByText('Limit of 4 per product reached')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
});

it('caps the total across different sizes of the same product at 4', () => {
  setup([
    { ...baseItem, id: 1, size: 'M', quantity: 3, stock: 50 },
    { ...baseItem, id: 2, size: 'L', quantity: 1, stock: 50 },
  ]);
  const limitMessages = screen.getAllByText('Limit of 4 per product reached');
  expect(limitMessages).toHaveLength(2);
  for (const button of screen.getAllByRole('button', { name: 'Increase quantity' })) {
    expect(button).toBeDisabled();
  }
});

it('does not cap a different product even if combined with this one it would exceed 4', () => {
  setup([
    { ...baseItem, id: 1, product_id: 9, quantity: 3, stock: 50 },
    { ...baseItem, id: 2, product_id: 10, size: 'L', quantity: 3, stock: 50 },
  ]);
  expect(screen.queryByText('Limit of 4 per product reached')).not.toBeInTheDocument();
  for (const button of screen.getAllByRole('button', { name: 'Increase quantity' })) {
    expect(button).toBeEnabled();
  }
});

it('shows the server\'s stock message when increasing quantity is rejected', async () => {
  updateQuantity = vi.fn().mockRejectedValue({ response: { data: { message: 'Only 1 left in stock for Linen shirt' } } });
  useAuth.mockReturnValue({ user: { id: 1 } });
  useCart.mockReturnValue({ cartItems: [{ ...baseItem, quantity: 1, stock: 5 }], loading: false, cartTotal: 2000, updateQuantity, removeFromCart: vi.fn() });
  render(<MemoryRouter><Cart /></MemoryRouter>);

  fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));

  expect(await screen.findByText('Only 1 left in stock for Linen shirt')).toBeInTheDocument();
});
