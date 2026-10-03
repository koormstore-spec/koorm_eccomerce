import { beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, testRouter } from '../test/router';
import Shop from './Shop';
import api from '../api/axios';

vi.mock('../api/axios', () => ({ default: { get: vi.fn() } }));
vi.mock('../components/ProductCard', () => ({ default: ({ product }) => <article>{product.name}</article> }));
const products = [{ id: 1, name: 'Black shirt', colors: ['Black'] }];
const colors = ['Black', 'Royal Blue', 'White & Grey'];
const show = (path = '/shop', props = {}) => render(<MemoryRouter initialEntries={[path]}><Shop {...props} /></MemoryRouter>);
const openFilters = () => fireEvent.click(screen.getByRole('button', { name: /^Filter/ }));

beforeEach(() => {
  vi.resetAllMocks();
  api.get.mockImplementation(url => Promise.resolve({ data: url === '/products/filters' ? { colors } : { products, pages: 3, total: 25 } }));
});

it('loads catalogue colours even when they are absent from the displayed page of products', async () => {
  show();
  openFilters();
  const select = screen.getByRole('combobox', { name: 'Colour' });
  await waitFor(() => expect(select).toBeEnabled());
  fireEvent.click(select);
  expect(within(screen.getByRole('listbox')).getAllByRole('option').map(option => option.querySelector('.color-option-label').textContent)).toEqual(['All colours', ...colors]);
  expect(screen.getByRole('article')).toHaveTextContent('Black shirt');
  expect(api.get).toHaveBeenCalledWith('/products/filters', expect.objectContaining({ signal: expect.any(AbortSignal) }));
});

it('applies the selected colour immediately, preserves other filters, and resets pagination', async () => {
  show('/shop?page=3&size=M&sale=true');
  openFilters();
  const select = screen.getByRole('combobox', { name: 'Colour' });
  await waitFor(() => expect(select).toBeEnabled());
  fireEvent.click(select);
  await act(async () => fireEvent.click(screen.getByRole('option', { name: 'Royal Blue' })));
  const params = new URLSearchParams(testRouter.location.search);
  expect(params.get('color')).toBe('Royal Blue');
  expect(params.get('size')).toBe('M');
  expect(params.get('sale')).toBe('true');
  expect(params.has('page')).toBe(false);
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/products', expect.objectContaining({ params: expect.objectContaining({ color: 'Royal Blue', size: 'M', sale: 'true', page: 1 }) })));
  fireEvent.click(select);
  await act(async () => fireEvent.click(screen.getByRole('option', { name: 'All colours' })));
  expect(new URLSearchParams(testRouter.location.search).has('color')).toBe(false);
  expect(new URLSearchParams(testRouter.location.search).get('size')).toBe('M');
});

it('preserves a selected colour from an existing link even if it is no longer listed', async () => {
  show('/shop?color=Vintage+Blue');
  openFilters();
  const select = screen.getByRole('combobox', { name: 'Colour' });
  await waitFor(() => expect(select).toBeEnabled());
  expect(select).toHaveTextContent('Vintage Blue');
  fireEvent.click(select);
  expect(screen.getByRole('option', { name: 'Vintage Blue' })).toBeInTheDocument();
});

it('retries colour loading without hiding the product results', async () => {
  api.get.mockImplementation(url => url === '/products/filters' ? Promise.reject(new Error('offline')) : Promise.resolve({ data: { products, pages: 1, total: 1 } }));
  show();
  openFilters();
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load colours');
  expect(screen.getByRole('article')).toHaveTextContent('Black shirt');
  api.get.mockResolvedValueOnce({ data: { colors } });
  fireEvent.click(screen.getByRole('button', { name: 'Retry colours' }));
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Colour' })).toBeEnabled());
  fireEvent.click(screen.getByRole('combobox', { name: 'Colour' }));
  expect(screen.getByRole('option', { name: 'Royal Blue' })).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('uses server-rendered colours without fetching them again', () => {
  show('/shop', { initialData: { query: '', products, pages: 1, total: 1 }, initialColors: colors });
  openFilters();
  fireEvent.click(screen.getByRole('combobox', { name: 'Colour' }));
  expect(screen.getByRole('option', { name: 'White & Grey' })).toBeInTheDocument();
  expect(api.get).not.toHaveBeenCalled();
});
