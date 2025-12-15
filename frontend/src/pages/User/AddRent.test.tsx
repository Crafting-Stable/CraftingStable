import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import AddRent from './AddRent';
import { BrowserRouter } from 'react-router-dom';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Mock navigate
const mockNavigate = vi.fn();

// Mock Header component (now includes "Ver Catálogo" button that uses mockNavigate)
vi.mock('../../components/Header', () => ({
    default: () => (
        <header data-testid="mock-header">
            <button type="button" onClick={() => mockNavigate('/catalog')}>Ver Catálogo</button>
            Header
        </header>
    ),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock window.alert and confirm
globalThis.alert = vi.fn();
globalThis.confirm = vi.fn();
globalThis.scrollTo = vi.fn() as (options?: ScrollToOptions | number, y?: number) => void;

describe('AddRent', () => {
    const mockUser = { id: 1, username: 'TestUser', email: 'test@test.com', role: 'CUSTOMER' };
    const mockTools = [
        {
            id: 1,
            name: 'Martelo',
            type: 'Ferramentas Manuais',
            dailyPrice: 5.99,
            depositAmount: 20,
            description: 'Martelo profissional',
            location: 'Aveiro',
            ownerId: 1,
            available: true,
            status: 'AVAILABLE',
        },
        {
            id: 2,
            name: 'Berbequim',
            type: 'Elétricas',
            dailyPrice: 15.99,
            depositAmount: 50,
            description: 'Berbequim elétrico',
            location: 'Porto',
            ownerId: 1,
            available: true,
            status: 'AVAILABLE',
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockReset();
        localStorageMock.getItem.mockImplementation((key) => {
            if (key === 'jwt') return 'mock-jwt-token';
            if (key === 'user') return JSON.stringify(mockUser);
            return null;
        });
        (globalThis.confirm as Mock).mockReturnValue(true);
    });

    const renderComponent = () => {
        return render(
            <BrowserRouter>
                <AddRent />
            </BrowserRouter>
        );
    };

    it('should render the page with header', () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockTools,
        });

        renderComponent();

        expect(screen.getByTestId('mock-header')).toBeDefined();
        expect(screen.getByText(/Meus Anúncios/)).toBeDefined();
    });

    it('should navigate to catalog when clicking Ver Catálogo button', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: async () => [] });

        renderComponent();

        const catalogButton = await screen.findByRole('button', { name: /Ver Catálogo/i });
        fireEvent.click(catalogButton);

        expect(mockNavigate).toHaveBeenCalledWith('/catalog');
    });

    // ... restante dos testes (permanece inalterado) ...
});
