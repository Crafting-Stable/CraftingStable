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
