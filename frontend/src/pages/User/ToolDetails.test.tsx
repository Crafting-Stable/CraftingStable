import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ToolDetails from './ToolDetails';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockNavigate = vi.fn();

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock child components to simplify tests
vi.mock('../../components/Header', () => ({
  default: () => <header data-testid="mock-header">Header</header>,
}));

vi.mock('../../components/LoadingScreen', () => ({
  default: () => <div data-testid="mock-loading">Loading...</div>,
}));

vi.mock('../../components/PayPalCheckout', () => ({
  default: ({ onSuccess, onError, onCancel, amount, disabled }: any) => (
    <div data-testid="mock-paypal">
      <span>PayPal Amount: {amount}</span>
      <button onClick={() => onSuccess({ id: 1, paypalOrderId: 'test-order' })} data-testid="paypal-success">
        Pay
      </button>
      <button onClick={() => onError('Payment failed')} data-testid="paypal-error">
        Error
      </button>
      <button onClick={onCancel} data-testid="paypal-cancel">
        Cancel
      </button>
      {disabled && <span data-testid="paypal-disabled">Disabled</span>}
    </div>
  ),
}));

vi.mock('../../components/RentSuccessModal', () => ({
  default: ({ rentData, onClose }: any) => (
    <div data-testid="mock-success-modal">
      <span>Rent ID: {rentData?.id}</span>
      <button onClick={onClose} data-testid="close-modal">
        Close
      </button>
    </div>
  ),
}));

describe('ToolDetails', () => {
  const mockTool = {
    id: 1,
    name: 'Martelo de Carpinteiro',
    type: 'Ferramentas Manuais',
    dailyPrice: 5.99,
    depositAmount: 20,
    description: 'Martelo profissional de alta qualidade',
    location: 'Aveiro',
    imageUrl: 'https://example.com/hammer.jpg',
    ownerId: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    localStorageMock.getItem.mockReturnValue('mock-jwt-token');
  });

  const renderWithRouter = (toolId = '1') => {
    return render(
      <MemoryRouter initialEntries={[`/tool/${toolId}`]}>
        <Routes>
          <Route path="/tool/:id" element={<ToolDetails />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('should redirect to login if no JWT token', () => {
    localStorageMock.getItem.mockReturnValue(null);

    renderWithRouter();

    expect(mockNavigate).toHaveBeenCalledWith('/loginPage');
  });

  it('should show loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithRouter();

    expect(screen.getByTestId('mock-loading')).toBeDefined();
  });

  it('should display tool details after successful fetch', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTool,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      }); // blocked-dates endpoint

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Martelo de Carpinteiro')).toBeDefined();
    });

    expect(screen.getByText('Martelo profissional de alta qualidade')).toBeDefined();
    expect(screen.getByText(/€5.99\/dia/)).toBeDefined();
  });

  it('should show "Ferramenta não encontrada" when tool not found', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      })
      .mockResolvedValueOnce({
        ok: false,
      });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Ferramenta não encontrada.')).toBeDefined();
    });

    expect(screen.getByText('Voltar ao catálogo')).toBeDefined();
  });

  it('should display location when available', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTool,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/Localização:/)).toBeDefined();
    });

    expect(screen.getByText('Aveiro')).toBeDefined();
  });

  it('should display deposit amount when available', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTool,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/Caução:/)).toBeDefined();
    });

    expect(screen.getByText(/€20/)).toBeDefined();
  });

  it('should render Header component', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTool,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    renderWithRouter();

    expect(screen.getByTestId('mock-header')).toBeDefined();
  });

  it('should display booking calendar with date inputs', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTool,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({ available: true }),
      });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Martelo de Carpinteiro')).toBeDefined();
    });

    // Check for date labels
    expect(screen.getByText(/Início:/)).toBeDefined();
    expect(screen.getByText(/Fim:/)).toBeDefined();
  });

  it('should calculate and display total price', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTool,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({ available: true }),
      });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/Preço\/dia:/)).toBeDefined();
    });

    expect(screen.getByText(/Total:/)).toBeDefined();
    expect(screen.getByText(/Dias:/)).toBeDefined();
  });

  it('should show login prompt when not authenticated', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    // Prevent navigation to actually check what would render
    mockNavigate.mockImplementation(() => {});

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTool,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    renderWithRouter();

    // Since it redirects, we just check the navigation was called
    expect(mockNavigate).toHaveBeenCalledWith('/loginPage');
  });

  it('should handle blocked dates endpoint', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTool,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],  // No blocked dates
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({ available: true }),
      });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Martelo de Carpinteiro')).toBeDefined();
    });

    // Verify the blocked dates endpoint was called
    expect(mockFetch).toHaveBeenCalled();
  });

  it('should fetch owner name for tool with ownerId', async () => {
    const toolWithOwner = { ...mockTool, ownerId: 5 };
    const ownerData = { id: 5, username: 'João Silva' };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => toolWithOwner,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ownerData,
      })
      .mockResolvedValue({
        ok: true,
        json: async () => ({ available: true }),
      });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText(/Vendedor:/)).toBeDefined();
    });
  });

  it('should handle fetch error gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Ferramenta não encontrada.')).toBeDefined();
    });
  });

  it('should display tool image', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTool,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    renderWithRouter();

    await waitFor(() => {
      const img = screen.getByAltText('Martelo de Carpinteiro');
      expect(img).toBeDefined();
      expect(img.getAttribute('src')).toBe('https://example.com/hammer.jpg');
    });
  });
});
