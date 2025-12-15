import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mock Header before importing component
vi.mock('../components/Header', () => ({
  default: () => <header data-testid="mock-header">Header</header>,
}));

vi.mock('../components/LoadingScreen', () => ({
  default: () => <div data-testid="mock-loading">Loading...</div>,
}));

// Now import the component
import CatalogPage from './Catalog';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('CatalogPage', () => {
  const mockTools = [
    {
      id: 1,
      name: 'Martelo',
      type: 'Ferramentas Manuais',
      dailyPrice: 5.99,
      location: 'Aveiro',
      status: 'AVAILABLE',
      imageUrl: 'https://example.com/hammer.jpg',
    },
    {
      id: 2,
      name: 'Berbequim Elétrico',
      type: 'Ferramentas Elétricas',
      dailyPrice: 15.99,
      location: 'Porto',
      status: 'AVAILABLE',
      imageUrl: 'https://example.com/drill.jpg',
    },
    {
      id: 3,
      name: 'Serra Circular',
      type: 'Ferramentas Elétricas',
      dailyPrice: 25.99,
      location: 'Aveiro',
      status: 'RENTED',
      imageUrl: 'https://example.com/saw.jpg',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  const renderCatalog = () => {
    return render(
      <BrowserRouter>
        <CatalogPage />
      </BrowserRouter>
    );
  };

  it('should render the page with header', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTools,
    });

    renderCatalog();

    expect(screen.getByTestId('mock-header')).toBeDefined();
  });

  it('should display loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    renderCatalog();

    expect(screen.getByTestId('mock-loading')).toBeDefined();
  });

  it('should display tools after successful fetch', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTools,
    });

    renderCatalog();

    await waitFor(() => {
      expect(screen.getByText('Martelo')).toBeDefined();
    });

    expect(screen.getByText('Berbequim Elétrico')).toBeDefined();
    expect(screen.getByText('Serra Circular')).toBeDefined();
  });

  it('should display page title', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTools,
    });

    renderCatalog();

    await waitFor(() => {
      expect(screen.getByText('Catálogo')).toBeDefined();
    });
  });

  it('should display search input', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTools,
    });

    renderCatalog();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Pesquisar ferramentas...')).toBeDefined();
    });
  });

  it('should filter tools by search query', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTools,
    });

    renderCatalog();

    await waitFor(() => {
      expect(screen.getByText('Martelo')).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText('Pesquisar ferramentas...');
    fireEvent.change(searchInput, { target: { value: 'Berbequim' } });

    await waitFor(() => {
      expect(screen.queryByText('Martelo')).toBeNull();
      expect(screen.getByText('Berbequim Elétrico')).toBeDefined();
    });
  });

  it('should display results count', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTools,
    });

    renderCatalog();

    await waitFor(() => {
      expect(screen.getByText('3 resultados')).toBeDefined();
    });
  });

  it('should update results count when filtering', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTools,
    });

    renderCatalog();

    await waitFor(() => {
      expect(screen.getByText('3 resultados')).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText('Pesquisar ferramentas...');
    fireEvent.change(searchInput, { target: { value: 'Serra' } });

    await waitFor(() => {
      expect(screen.getByText('1 resultados')).toBeDefined();
    });
  });

  it('should display tool prices', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTools,
    });

    renderCatalog();

    await waitFor(() => {
      expect(screen.getByText('€5.99/dia')).toBeDefined();
    });

    expect(screen.getByText('€15.99/dia')).toBeDefined();
    expect(screen.getByText('€25.99/dia')).toBeDefined();
  });

  it('should display tool locations', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTools,
    });

    renderCatalog();

    await waitFor(() => {
      expect(screen.getAllByText('Aveiro').length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText('Porto').length).toBeGreaterThan(0);
  });

  it('should display tool status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTools,
    });

    renderCatalog();

    await waitFor(() => {
      expect(screen.getAllByText(/Estado: AVAILABLE/).length).toBe(2);
    });

    expect(screen.getByText('Estado: RENTED')).toBeDefined();
  });

  it('should display category filter buttons', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTools,
    });

    renderCatalog();

    await waitFor(() => {
      expect(screen.getByText('Ver tudo')).toBeDefined();
    });

    expect(screen.getByText('Jardinagem')).toBeDefined();
    expect(screen.getByText('Obras')).toBeDefined();
    expect(screen.getByText('Carpintaria')).toBeDefined();
    expect(screen.getByText('Elétricas')).toBeDefined();
  });

  it('should display "Ver" links for each tool', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTools,
    });

    renderCatalog();

    await waitFor(() => {
      const viewLinks = screen.getAllByText('Ver');
      expect(viewLinks.length).toBe(3);
    });
  });

  it('should handle fetch error gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    renderCatalog();

    await waitFor(() => {
      expect(screen.getByText('0 resultados')).toBeDefined();
    });
  });

  it('should handle empty tools array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    renderCatalog();

    await waitFor(() => {
      expect(screen.getByText('0 resultados')).toBeDefined();
    });
  });

  it('should display footer with copyright', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTools,
    });

    renderCatalog();

    await waitFor(() => {
      expect(screen.getByText(/Crafting Stable — Aluguer de ferramentas/)).toBeDefined();
    });
  });

  it('should sort tools by price ascending', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTools,
    });

    renderCatalog();

    await waitFor(() => {
      expect(screen.getByText('Martelo')).toBeDefined();
    });

    // Find sort select and change to price ascending
    const sortSelect = screen.getByDisplayValue('Relevância');
    fireEvent.change(sortSelect, { target: { value: 'price-asc' } });

    // Verify the sort option changed
    expect(screen.getByDisplayValue('Preço ↑')).toBeDefined();
  });

  it('should sort tools by price descending', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTools,
    });

    renderCatalog();

    await waitFor(() => {
      expect(screen.getByText('Martelo')).toBeDefined();
    });

    const sortSelect = screen.getByDisplayValue('Relevância');
    fireEvent.change(sortSelect, { target: { value: 'price-desc' } });

    expect(screen.getByDisplayValue('Preço ↓')).toBeDefined();
  });

  it('should display tool images', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTools,
    });

    renderCatalog();

    await waitFor(() => {
      const images = screen.getAllByRole('img');
      expect(images.length).toBe(3);
    });
  });
});
