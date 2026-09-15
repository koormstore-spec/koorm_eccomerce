import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProductCard from './ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/CartContext', () => ({ useCart: vi.fn() }));
vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));

const baseProduct = {
  id: 1,
  slug: 'linen-shirt-rust-red',
  name: 'Linen Shirt - Rust Red',
  brand: 'Koorm',
  price: 2499,
  discount_price: null,
  images: ['/images/products/1/1.jpg'],
  sizes: ['S', 'M', 'L'],
  rating: 4.5,
  num_reviews: 32,
  created_at: '2020-01-01T00:00:00.000Z', // old, so "New" badge should never show
};

const renderCard = (product, { user = null, toggleWishlist = vi.fn(), addToCart = vi.fn(), wishlist = [] } = {}) => {
  useCart.mockReturnValue({ wishlist, toggleWishlist, addToCart });
  useAuth.mockReturnValue({ user });
  return render(
    <MemoryRouter>
      <ProductCard product={product} />
    </MemoryRouter>
  );
};

describe('ProductCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the product name, brand, and price', () => {
    renderCard(baseProduct);
    expect(screen.getByText('Linen Shirt - Rust Red')).toBeInTheDocument();
    expect(screen.getByText('Koorm')).toBeInTheDocument();
    expect(screen.getByText('₹2,499')).toBeInTheDocument();
  });

  it('shows a sale badge with the correct percentage when discounted', () => {
    renderCard({ ...baseProduct, price: 2000, discount_price: 1500 });
    expect(screen.getByText('-25%')).toBeInTheDocument();
    expect(screen.getByText('₹1,500')).toBeInTheDocument();
    expect(screen.getByText('₹2,000')).toBeInTheDocument(); // struck-through original price
  });

  it('shows no sale badge and no struck-through price when there is no discount', () => {
    renderCard(baseProduct);
    expect(screen.queryByText(/^-\d+%$/)).not.toBeInTheDocument();
  });

  it('shows a "New" badge for a recently added product with no discount', () => {
    const recent = new Date().toISOString();
    renderCard({ ...baseProduct, created_at: recent });
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('prefers the sale badge over the New badge when both would apply', () => {
    const recent = new Date().toISOString();
    renderCard({ ...baseProduct, created_at: recent, price: 2000, discount_price: 1500 });
    expect(screen.getByText('-25%')).toBeInTheDocument();
    expect(screen.queryByText('New')).not.toBeInTheDocument();
  });

  it('does not render a wishlist button for a logged-out visitor', () => {
    renderCard(baseProduct, { user: null });
    expect(screen.queryByLabelText('Toggle wishlist')).not.toBeInTheDocument();
  });

  it('renders a wishlist button for a logged-in user and toggles it on click', () => {
    const toggleWishlist = vi.fn();
    renderCard(baseProduct, { user: { id: 1, name: 'Jane' }, toggleWishlist });

    const button = screen.getByLabelText('Toggle wishlist');
    fireEvent.click(button);

    expect(toggleWishlist).toHaveBeenCalledWith(1);
  });

  it('does not render the quick-add size overlay when the product has no sizes', () => {
    renderCard({ ...baseProduct, sizes: [] }, { user: { id: 1, name: 'Jane' } });
    expect(screen.queryByText('S')).not.toBeInTheDocument();
  });

  it('links to the product detail page by slug', () => {
    renderCard(baseProduct);
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/product/linen-shirt-rust-red');
  });
});
