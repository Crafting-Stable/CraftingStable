import { vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import UserDetailsPage from './UserDetailsPage';

const originalFetch = global.fetch;

beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
});

afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
});

test('mostra "Não autenticado" quando não há user no localStorage', async () => {
    render(
        <MemoryRouter>
            <UserDetailsPage />
        </MemoryRouter>
    );

    const unauth = await screen.findByText(/Não autenticado/i);
    expect(unauth).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Ir para Login/i })).toBeInTheDocument();
});

test('mostra perfil e contadores quando existe user e jwt e fetch retorna rents\\/tools', async () => {
    localStorage.setItem('jwt', 'fake-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, username: 'Joao', email: 'joao@example.com' }));

    (global as any).fetch = vi.fn((input: RequestInfo) => {
        const url = String(input);
        if (url.includes('/api/rents')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([
                    {
                        id: 10,
                        toolId: 100,
                        userId: 1,
                        status: 'PENDING',
                        startDate: '2025-01-01T00:00:00.000Z',
                        endDate: '2025-01-02T00:00:00.000Z',
                        message: 'Por favor'
                    }
                ])
            });
        }

        if (url.includes('/api/tools')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([
                    { id: 100, name: 'Furadeira', ownerId: 1, status: 'AVAILABLE' }
                ])
            });
        }

        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 1, username: 'Joao', email: 'joao@example.com', role: 'Utilizador' })
        });
    });

    render(
        <MemoryRouter>
            <UserDetailsPage />
        </MemoryRouter>
    );

    // espera que o nome do utilizador apareça no perfil
    await screen.findByText(/Joao/);

    // verifica contadores nos tabs
    expect(screen.getByRole('button', { name: /📦 Minhas Reservas \(1\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /⏳ Pendentes \(1\)/i })).toBeInTheDocument();
    const ferramentasTab = screen.getByRole('button', { name: /🛠️ Minhas Ferramentas \(1\)/i });
    expect(ferramentasTab).toBeInTheDocument();

    // ativa a aba de Ferramentas para mostrar a lista
    await userEvent.click(ferramentasTab);

    // garante que a ferramenta aparece no DOM
    await screen.findByText(/Furadeira/);
    expect(screen.getByText(/Furadeira/)).toBeInTheDocument();
});

test('mostra dias de aluguer específicos na aba Minhas Reservas', async () => {
    localStorage.setItem('jwt', 'fake-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, username: 'Maria', email: 'maria@example.com' }));

    (global as any).fetch = vi.fn((input: RequestInfo) => {
        const url = String(input);
        if (url.includes('/api/rents')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([
                    {
                        id: 20,
                        toolId: 200,
                        userId: 1,
                        status: 'APPROVED',
                        startDate: '2025-06-10',
                        endDate: '2025-06-13',
                        message: ''
                    }
                ])
            });
        }

        if (url.includes('/api/tools')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([
                    { id: 200, name: 'Serra Circular', ownerId: 2, status: 'RENTED' }
                ])
            });
        }

        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 1, username: 'Maria', email: 'maria@example.com', role: 'Utilizador' })
        });
    });

    render(
        <MemoryRouter>
            <UserDetailsPage />
        </MemoryRouter>
    );

    // Espera pelo carregamento
    await screen.findByText(/Maria/);

    // Clica na aba de reservas
    const reservasTab = screen.getByRole('button', { name: /📦 Minhas Reservas \(1\)/i });
    await userEvent.click(reservasTab);

    // Verifica que a ferramenta é exibida
    await screen.findByText(/Serra Circular/);
    
    // Verifica que o número de dias é exibido (4 dias: 10, 11, 12, 13 de junho)
    // O texto está fragmentado em múltiplos text nodes - usamos queryAllByText para evitar erro de múltiplos matches
    const daysElements = screen.queryAllByText((_content, element) => {
        return element?.tagName === 'DIV' && 
               element?.textContent?.includes('4') && 
               element?.textContent?.includes('de aluguer') || false;
    });
    expect(daysElements.length).toBeGreaterThan(0);
    
    // Verifica que os dias individuais são exibidos como badges (quando <= 7 dias)
    // Os badges usam formato DD/MM
    expect(screen.getByText('10/06')).toBeInTheDocument();
    expect(screen.getByText('11/06')).toBeInTheDocument();
    expect(screen.getByText('12/06')).toBeInTheDocument();
    expect(screen.getByText('13/06')).toBeInTheDocument();
});
