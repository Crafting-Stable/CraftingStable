// src/pages/Admin/AdminUsers.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock adminUtils before importing the component
vi.mock('./adminUtils', () => ({
    getJwt: vi.fn(() => 'token'),
    apiUrl: (path: string) => path,
    handleAuthError: vi.fn(() => false),
}));

// Mock react-router-dom but preserve actual exports
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => vi.fn(),
        Link: ({ children, to }: any) => <a href={to}>{children}</a>,
    };
});

import AdminUsers from './AdminUsers';
import { MemoryRouter } from 'react-router-dom';

describe('AdminUsers', () => {
    const usersInitial = [
        { id: 1, name: 'Alice', email: 'alice@example.com', type: 'CUSTOMER', active: false },
        { id: 2, name: 'Bob', email: 'bob@example.com', type: 'ADMIN', active: true },
    ];

    beforeEach(() => {
        (global as any).fetch = vi.fn();
        (global as any).alert = vi.fn();
        (global as any).confirm = vi.fn(() => true);
        vi.clearAllMocks();
    });

    afterAll(() => {
        vi.resetAllMocks();
    });

    test('mostra loading e depois lista de usuários', async () => {
        (global as any).fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => usersInitial,
        });

        render(
            <MemoryRouter>
                <AdminUsers />
            </MemoryRouter>
        );

        expect(screen.getByText(/Loading/i)).toBeInTheDocument();

        expect(await screen.findByText('Alice')).toBeInTheDocument();
        expect(await screen.findByText('Bob')).toBeInTheDocument();
        expect(screen.getByText(/2 users/i)).toBeInTheDocument();
    });

    test('filtro ADMIN mostra apenas administradores', async () => {
        (global as any).fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => usersInitial,
        });

        render(
            <MemoryRouter>
                <AdminUsers />
            </MemoryRouter>
        );

        await screen.findByText('Alice');

        // Seleciona explicitamente o botão de filtro por role para evitar badges com o mesmo texto
        const adminFilter = screen.getByRole('button', { name: 'ADMIN' });
        fireEvent.click(adminFilter);

        expect(screen.queryByText('Alice')).not.toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.getByText(/1 users/i)).toBeInTheDocument();
    });

    test('ativa usuário e refaz fetch', async () => {
        const usersAfterActivate = [
            { id: 1, name: 'Alice', email: 'alice@example.com', type: 'CUSTOMER', active: true },
            { id: 2, name: 'Bob', email: 'bob@example.com', type: 'ADMIN', active: true },
        ];

        (global as any).fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => usersInitial,
            })
            .mockResolvedValueOnce({ ok: true })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => usersAfterActivate,
            });

        render(
            <MemoryRouter>
                <AdminUsers />
            </MemoryRouter>
        );

        await screen.findByText('Alice');

        const activateBtn = screen.getByText('Activate');
        fireEvent.click(activateBtn);

        await waitFor(() => {
            expect(screen.getAllByText('ACTIVE').length).toBeGreaterThanOrEqual(1);
        });

        const calls = (global as any).fetch.mock.calls;
        const activateCall = calls.find((c: any[]) => c[0] === '/api/users/1/activate');
        expect(activateCall).toBeDefined();
        expect(activateCall![1].method).toBe('PUT');
    });

    test('muda papel do usuário após confirmação', async () => {
        const usersAfterRoleChange = [
            { id: 1, name: 'Alice', email: 'alice@example.com', type: 'ADMIN', active: false },
            { id: 2, name: 'Bob', email: 'bob@example.com', type: 'ADMIN', active: true },
        ];

        (global as any).confirm = vi.fn(() => true);

        (global as any).fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => usersInitial,
            })
            .mockResolvedValueOnce({ ok: true })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => usersAfterRoleChange,
            });

        render(
            <MemoryRouter>
                <AdminUsers />
            </MemoryRouter>
        );

        await screen.findByText('Alice');

        const changeRoleBtn = screen.getByText(/Make Admin/i);
        fireEvent.click(changeRoleBtn);

        await waitFor(() => {
            expect(screen.getAllByText('ADMIN').length).toBeGreaterThanOrEqual(1);
        });

        const calls = (global as any).fetch.mock.calls;
        const roleCall = calls.find((c: any[]) => c[0] === '/api/users/1/role');
        expect(roleCall).toBeDefined();
        expect(roleCall![1].method).toBe('PUT');
        expect(roleCall![1].body).toBe(JSON.stringify({ role: 'ADMIN' }));
    });
});
