// TypeScript
// File: `frontend/src/pages/User/AddRent.test.tsx`

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import AddRent from './AddRent';
import { BrowserRouter} from 'react-router-dom';

// Mock Header component
vi.mock('../../components/Header', () => ({
    default: () => <header data-testid="mock-header">Header</header>,
}));

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
        expect(screen.getByText('Minhas Ferramentas')).toBeDefined();
    });

    it('should display form to create new tool', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockTools,
        });

        renderComponent();

        // aguarda inputs
        await waitFor(() => {
            expect(screen.getByLabelText(/Nome da Ferramenta/)).toBeDefined();
        });

        expect(screen.getByText('Criar Novo Anúncio')).toBeDefined();
        expect(screen.getByLabelText(/Nome da Ferramenta/)).toBeDefined();
        expect(screen.getByLabelText(/Categoria/)).toBeDefined();
        expect(screen.getByLabelText(/Preço por Dia/)).toBeDefined();
        expect(screen.getByLabelText(/Caução/)).toBeDefined();
        expect(screen.getByLabelText(/Localização/)).toBeDefined();
        expect(screen.getByLabelText(/URL da Imagem/)).toBeDefined();
        expect(screen.getByLabelText(/Descrição/)).toBeDefined();
    });

    it('should load and display user tools', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockTools,
        });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Martelo')).toBeDefined();
        });

        expect(screen.getByText('Berbequim')).toBeDefined();
        expect(screen.getByText(/€5.99\/dia/)).toBeDefined();
    });

    it('should show error when form fields are empty on submit', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => [],
        });

        renderComponent();

        // Wait for the form to be ready
        await waitFor(() => {
            expect(screen.getByLabelText(/Nome da Ferramenta/)).toBeDefined();
        });

        const submitButton = await screen.findByRole('button', { name: /Criar Anúncio/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText('Preencha todos os campos obrigatórios')).toBeDefined();
        });
    });

    it('should create new tool successfully', async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: async () => [] }) // Initial load
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: 3,
                    name: 'Nova Ferramenta',
                    type: 'Jardinagem',
                    dailyPrice: 10,
                    depositAmount: 30,
                    description: 'Descrição teste',
                    location: 'Lisboa',
                    ownerId: 1,
                }),
            });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByLabelText(/Nome da Ferramenta/)).toBeDefined();
        });

        // Fill form
        fireEvent.change(screen.getByLabelText(/Nome da Ferramenta/), { target: { value: 'Nova Ferramenta' } });
        fireEvent.change(screen.getByLabelText(/Categoria/), { target: { value: 'Jardinagem' } });
        fireEvent.change(screen.getByLabelText(/Preço por Dia/), { target: { value: '10' } });
        fireEvent.change(screen.getByLabelText(/Caução/), { target: { value: '30' } });
        fireEvent.change(screen.getByLabelText(/Localização/), { target: { value: 'Lisboa' } });
        fireEvent.change(screen.getByLabelText(/Descrição/), { target: { value: 'Descrição teste' } });

        const submitButton = await screen.findByRole('button', { name: /Criar Anúncio/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(globalThis.alert).toHaveBeenCalledWith('Ferramenta criada com sucesso!');
        });
    });

    it('should clear form when clicking clear button', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: async () => [] });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByLabelText(/Nome da Ferramenta/)).toBeDefined();
        });

        // Fill form
        const nameInput = screen.getByLabelText(/Nome da Ferramenta/) as HTMLInputElement;
        fireEvent.change(nameInput, { target: { value: 'Test Tool' } });
        expect(nameInput.value).toBe('Test Tool');

        // Click clear
        const clearButton = await screen.findByRole('button', { name: /Limpar/i });
        fireEvent.click(clearButton);

        expect(nameInput.value).toBe('');
    });

    it('should redirect when no JWT token', async () => {
        localStorageMock.getItem.mockReturnValue(null);

        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
        });

        renderComponent();

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/loginPage');
        }, { timeout: 3000 });
    });

    it('should handle 401 error and redirect to login', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
            text: async () => 'Unauthorized',
        });

        renderComponent();

        await waitFor(() => {
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('jwt');
        }, { timeout: 3000 });
    });

    it('should navigate to catalog when clicking Ver Catálogo button', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: async () => [] });

        renderComponent();

        const catalogButton = await screen.findByRole('button', { name: /Ver Catálogo/i });
        fireEvent.click(catalogButton);

        expect(mockNavigate).toHaveBeenCalledWith('/catalog');
    });

    it('should show empty state when no tools exist', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: async () => [] });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText(/Ainda não criou nenhum anúncio/)).toBeDefined();
        });
    });

    it('should allow editing a tool', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: async () => mockTools });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Martelo')).toBeDefined();
        });

        const editButtons = screen.getAllByText('Editar');
        fireEvent.click(editButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Editar Ferramenta')).toBeDefined();
        });

        const nameInput = screen.getByLabelText(/Nome da Ferramenta/) as HTMLInputElement;
        expect(nameInput.value).toBe('Martelo');
    });

    it('should update tool successfully', async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: async () => mockTools }) // Initial load
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ ...mockTools[0], name: 'Martelo Atualizado' }),
            });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Martelo')).toBeDefined();
        });

        // Click edit
        const editButtons = screen.getAllByText('Editar');
        fireEvent.click(editButtons[0]);

        // Change name
        const nameInput = screen.getByLabelText(/Nome da Ferramenta/) as HTMLInputElement;
        fireEvent.change(nameInput, { target: { value: 'Martelo Atualizado' } });

        // Submit
        const submitButton = await screen.findByRole('button', { name: /Atualizar/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(globalThis.alert).toHaveBeenCalledWith('Ferramenta atualizada com sucesso!');
        });
    });

    it('should delete tool with confirmation', async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: async () => mockTools })
            .mockResolvedValueOnce({ ok: true, status: 204 });

        (globalThis.confirm as Mock).mockReturnValue(true);

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Martelo')).toBeDefined();
        });

        const deleteButtons = screen.getAllByText('Apagar');
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(globalThis.confirm).toHaveBeenCalledWith('Tem a certeza que pretende apagar esta ferramenta?');
            expect(globalThis.alert).toHaveBeenCalledWith('Ferramenta apagada com sucesso!');
        });
    });

    it('should not delete tool when confirmation is cancelled', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: async () => mockTools });

        (globalThis.confirm as Mock).mockReturnValue(false);

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Martelo')).toBeDefined();
        });

        const deleteButtons = screen.getAllByText('Apagar');
        fireEvent.click(deleteButtons[0]);

        // Should not make delete request
        expect(mockFetch).toHaveBeenCalledTimes(1); // Only initial load
    });

    it('should show tool details (price, deposit, location)', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: async () => mockTools });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Martelo')).toBeDefined();
        });

        expect(screen.getByText(/€5.99\/dia/)).toBeDefined();
        expect(screen.getByText(/Caução: €20.00/)).toBeDefined();
        expect(screen.getByText(/Ferramentas Manuais • Aveiro/)).toBeDefined();
    });

    it('should handle API error gracefully', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        renderComponent();

        // Should handle error without crashing
        await waitFor(() => {
            expect(screen.getByTestId('mock-header')).toBeDefined();
        });
    });

    it('should show loading state', () => {
        mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

        renderComponent();

        // Component should render while loading
        expect(screen.getByTestId('mock-header')).toBeDefined();
    });

    it('should handle form submission with image URL', async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: async () => [] })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: 3,
                    name: 'Nova Ferramenta',
                    type: 'Obras',
                    dailyPrice: 10,
                    depositAmount: 30,
                    description: 'Descrição teste',
                    location: 'Lisboa',
                    imageUrl: 'https://example.com/image.jpg',
                    ownerId: 1,
                }),
            });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByLabelText(/Nome da Ferramenta/)).toBeDefined();
        });

        // Fill form including image URL
        fireEvent.change(screen.getByLabelText(/Nome da Ferramenta/), { target: { value: 'Nova Ferramenta' } });
        fireEvent.change(screen.getByLabelText(/Categoria/), { target: { value: 'Obras' } });
        fireEvent.change(screen.getByLabelText(/Preço por Dia/), { target: { value: '10' } });
        fireEvent.change(screen.getByLabelText(/Caução/), { target: { value: '30' } });
        fireEvent.change(screen.getByLabelText(/Localização/), { target: { value: 'Lisboa' } });
        fireEvent.change(screen.getByLabelText(/URL da Imagem/), { target: { value: 'https://example.com/image.jpg' } });
        fireEvent.change(screen.getByLabelText(/Descrição/), { target: { value: 'Descrição teste' } });

        const submitButton = await screen.findByRole('button', { name: /Criar Anúncio/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(globalThis.alert).toHaveBeenCalledWith('Ferramenta criada com sucesso!');
        });
    });

    it('should select different categories', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: async () => [] });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByLabelText(/Categoria/)).toBeDefined();
        });

        const categorySelect = screen.getByLabelText(/Categoria/) as HTMLSelectElement;

        // Test all category options
        const categories = ['Jardinagem', 'Obras', 'Carpintaria', 'Elétricas'];
        for (const category of categories) {
            fireEvent.change(categorySelect, { target: { value: category } });
            expect(categorySelect.value).toBe(category);
        }
    });

    it('should display tool count in section header', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: async () => mockTools });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Meus Anúncios (2)')).toBeDefined();
        });
    });

    it('should handle 403 forbidden error', async () => {
        mockFetch
            .mockResolvedValueOnce({ ok: true, json: async () => mockTools })
            .mockResolvedValueOnce({
                ok: false,
                status: 403,
                text: async () => 'Forbidden',
            });

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Martelo')).toBeDefined();
        });

        // Try to create a tool
        fireEvent.change(screen.getByLabelText(/Nome da Ferramenta/), { target: { value: 'Test' } });
        fireEvent.change(screen.getByLabelText(/Categoria/), { target: { value: 'Obras' } });
        fireEvent.change(screen.getByLabelText(/Preço por Dia/), { target: { value: '10' } });
        fireEvent.change(screen.getByLabelText(/Caução/), { target: { value: '30' } });
        fireEvent.change(screen.getByLabelText(/Localização/), { target: { value: 'Lisboa' } });
        fireEvent.change(screen.getByLabelText(/Descrição/), { target: { value: 'Descrição' } });

        const submitButton = await screen.findByRole('button', { name: /Criar Anúncio/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('jwt');
        });
    });

    it('should fetch user from /api/auth/me when not in localStorage', async () => {
        localStorageMock.getItem.mockImplementation((key) => {
            if (key === 'jwt') return 'mock-jwt-token';
            if (key === 'user') return null;
            return null;
        });

        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 1, username: 'FetchedUser', email: 'fetched@test.com', role: 'CUSTOMER' }),
            })
            .mockResolvedValueOnce({ ok: true, json: async () => mockTools });

        renderComponent();

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/auth/me'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer mock-jwt-token',
                    }),
                })
            );
        });
    });

    it('should filter tools to only show tools owned by current user', async () => {
        // The component filters tools locally: data.filter(t => Number(t.ownerId) === Number(currentUserId))
        // This ensures only the current user's tools are shown
        // Tools with different ownerId are filtered out before rendering

        // Mix of tools: some owned by current user (1), some by others (999)
        const mixedTools = [
            { ...mockTools[0], ownerId: 1 }, // Current user's tool - should show
            { ...mockTools[1], ownerId: 999 }, // Other user's tool - should be filtered
        ];

        mockFetch.mockResolvedValue({ ok: true, json: async () => mixedTools });

        renderComponent();

        // Wait for page to load
        await waitFor(() => {
            expect(screen.getByText('Minhas Ferramentas')).toBeDefined();
        });

        // Should show the tool owned by current user
        await waitFor(() => {
            expect(screen.getByText('Martelo')).toBeDefined();
        });

        // Should NOT show the tool owned by different user (filtered out)
        expect(screen.queryByText('Berbequim')).toBeNull();

        // Edit button should appear for the user's own tool
        expect(screen.getByText('Editar')).toBeDefined();
    });
});
