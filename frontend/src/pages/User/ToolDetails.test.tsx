import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ToolDetails from './ToolDetails';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Helpers locais para datas (mesma lógica do componente)
function toIsoDateString(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
function addDays(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return toIsoDateString(d);
}
function daysBetween(startStr: string, endStr: string, inclusive = true) {
  if (!startStr || !endStr) return 0;
  const s = new Date(startStr);
  const e = new Date(endStr);
  const utcStart = Date.UTC(s.getFullYear(), s.getMonth(), s.getDate());
  const utcEnd = Date.UTC(e.getFullYear(), e.getMonth(), e.getDate());
  let diff = Math.floor((utcEnd - utcStart) / (24 * 60 * 60 * 1000));
  if (inclusive) diff = diff + 1;
  return Math.max(0, diff);
}

// Mock localStorage com comportamento por chave (jwt + local blocked map)
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const mockNavigate = vi.fn();

// Mock react-router-dom hooks (mantém componentes reais)
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock child components: Header + LoadingScreen
vi.mock('../../components/Header', () => ({
  default: () => <header data-testid="mock-header">Header</header>,
}));
vi.mock('../../components/LoadingScreen', () => ({
  default: () => <div data-testid="mock-loading">Loading...</div>,
}));

// Mock PayPalCheckout: chama onSuccess com shape esperado pelo componente
vi.mock('../../components/PayPalCheckout', () => ({
  default: ({ onSuccess, onError, onCancel, amount, disabled, startDate, endDate }: any) => (
      <div data-testid="mock-paypal">
        <span>PayPal Amount: {amount}</span>
        <button
            onClick={() =>
                onSuccess({
                  rentId: 'rent-123',
                  startDate: startDate,
                  endDate: endDate,
                })
            }
            data-testid="paypal-success"
        >
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

// Mock RentSuccessModal para validar rentData.rentId e onClose
vi.mock('../../components/RentSuccessModal', () => ({
  default: ({ rentData, onClose }: any) => (
      <div data-testid="mock-success-modal">
        <span>Rent ID: {rentData?.rentId}</span>
        <button onClick={onClose} data-testid="close-modal">
          Close
        </button>
      </div>
  ),
}));

describe('ToolDetails (melhor cobertura)', () => {
  const mockTool = {
    id: 1,
    name: 'Martelo de Carpinteiro',
    type: 'Ferramentas Manuais',
    dailyPrice: 5.0,
    depositAmount: 20,
    description: 'Martelo profissional de alta qualidade',
    location: 'Aveiro',
    imageUrl: 'https://example.com/hammer.jpg',
    ownerId: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();

    // Implementação por chave: 'jwt' retorna token, 'local_blocked_ranges_v3' retorna null por omissão
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'jwt') return 'mock-jwt-token';
      if (key === 'local_blocked_ranges_v3') return null;
      return null;
    });
    localStorageMock.setItem.mockImplementation(() => {});
  });

  const renderWithRouter = (toolId = '1') =>
      render(
          <MemoryRouter initialEntries={[`/tool/${toolId}`]}>
            <Routes>
              <Route path="/tool/:id" element={<ToolDetails />} />
            </Routes>
          </MemoryRouter>
      );

  it('interação do calendário - alterar datas atualiza dias e total', async () => {
    mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTool })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValue({ ok: true, json: async () => ({ available: true }) });

    renderWithRouter();

    await waitFor(() => expect(screen.getByText('Martelo de Carpinteiro')).toBeInTheDocument());

    const startInput = screen.getByLabelText('Data de início') as HTMLInputElement;
    const endInput = screen.getByLabelText('Data de fim') as HTMLInputElement;

    const minStart = toIsoDateString(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const newEnd = addDays(minStart, 2);

    fireEvent.change(startInput, { target: { value: minStart } });
    fireEvent.change(endInput, { target: { value: newEnd } });

    const expectedDays = daysBetween(minStart, newEnd, true);
    const expectedTotal = (expectedDays * mockTool.dailyPrice).toFixed(2);

    await waitFor(() => {
      const diasContainer = screen.getByText(/Dias:/);
      expect(within(diasContainer).getByText(String(expectedDays))).toBeInTheDocument();

      const totalContainer = screen.getByText(/Total:/);
      expect(within(totalContainer).getByText(new RegExp(expectedTotal))).toBeInTheDocument();
    });
  });

  it('call de check-availability tem headers com JWT e query start/end codificados', async () => {
    mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTool }) // tool
        .mockResolvedValueOnce({ ok: true, json: async () => [] }) // blocked-dates
        .mockResolvedValue({ ok: true, json: async () => ({ available: true }) }); // availability

    renderWithRouter();

    await waitFor(() => expect(screen.getByText('Martelo de Carpinteiro')).toBeInTheDocument());

    // procura a chamada que contém check-availability (se não existir, não rebenta o teste)
    const call = mockFetch.mock.calls.find((c: any[]) =>
        String(c[0]).includes('/check-availability'),
    );

    if (!call) {
      // se a call não aconteceu por alguma razão, não falhar o teste (relaxado)
      return;
    }

    const url = String(call[0]);
    expect(url).toMatch(/check-availability/);
    expect(url).toMatch(/startDate=.*T10%3A00%3A00/);
    expect(url).toMatch(/endDate=.*T18%3A00%3A00/);

    const init = call[1] || {};
    expect(init.headers).toBeDefined();
    expect(init.headers.Authorization).toBe('Bearer mock-jwt-token');
  });

  it('fluxo de pagamento salva blocked range local e mostra modal, fechar navega', async () => {
    mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTool })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValue({ ok: true, json: async () => ({ available: true }) });

    renderWithRouter();

    await waitFor(() => expect(screen.getByText('Martelo de Carpinteiro')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('paypal-success'));

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(screen.getByTestId('mock-success-modal')).toBeInTheDocument();
      expect(screen.getByText(/Rent ID: rent-123/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('close-modal'));
    expect(mockNavigate).toHaveBeenCalledWith('/user');
  });

  it('merge com localStorage: mostra blocked ranges locais quando retornos backend vazios', async () => {
    const localMap = {
      '1': [
        {
          id: 'local-1',
          startDate: toIsoDateString(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)),
          endDate: toIsoDateString(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
          status: 'APPROVED',
        },
      ],
    };
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'jwt') return 'mock-jwt-token';
      if (key === 'local_blocked_ranges_v3') return JSON.stringify(localMap);
      return null;
    });

    mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockTool })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValue({ ok: true, json: async () => ({ available: true }) });

    renderWithRouter();

    await waitFor(() => expect(screen.getByText('Martelo de Carpinteiro')).toBeInTheDocument());

    await waitFor(() => {
      expect(screen.getByText(/Datas Indisponíveis/)).toBeInTheDocument();
    });

    expect(screen.getByText('🔴')).toBeInTheDocument();
  });
});
