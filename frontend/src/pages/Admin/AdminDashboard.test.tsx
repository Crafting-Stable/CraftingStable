// frontend/src/pages/Admin/AdminDashboard.test.tsx
import React from 'react';
import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// mock deve ser declarado antes de importar o componente
vi.mock('./adminUtils', () => ({
    apiUrl: (p: string) => p,
    getJwt: vi.fn(() => 'fake-token'),
    handleAuthError: vi.fn(),
}));

vi.mock('./adminStyles', () => ({
    adminStyles: {
        container: { padding: '0' },
        header: {},
        title: {},
        nav: {},
        navLink: {},
        content: {},
        loading: {},
        error: {},
    },
}));

import AdminDashboard from './AdminDashboard';
import { MemoryRouter } from 'react-router-dom';
import * as adminUtils from './adminUtils';

const sampleStats = {
    totalRents: 100,
    totalUsers: 42,
    totalTools: 28,
    mostRentedTool: 'Hammer',
    averageRentDurationDays: 3.5,
    pendingRents: 5,
    approvedRents: 90,
    rejectedRents: 5,
    approvalRate: 90,
    activeUsers: 20,
    availableTools: 10,
    rentedTools: 18,
};

const mockedHandleAuthError = (adminUtils as any).handleAuthError as any;

beforeEach(() => {
    vi.resetAllMocks();
});

test('exibe loading e depois renderiza estatísticas quando a API responde com sucesso', async () => {
    (global as any).fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => sampleStats,
    });

    render(
        <MemoryRouter>
            <AdminDashboard />
        </MemoryRouter>
    );

    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

    await waitFor(() => {
        expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument();
        expect(screen.getByText(/Total Users/i)).toBeInTheDocument();
        expect(screen.getByText(String(sampleStats.totalUsers))).toBeInTheDocument();
        expect(screen.getByText(/Most Rented Tool/i)).toBeInTheDocument();
        expect(screen.getByText(sampleStats.mostRentedTool)).toBeInTheDocument();
    });

    expect(mockedHandleAuthError).not.toHaveBeenCalled();
});

test('exibe mensagem de erro quando a API retorna erro', async () => {
    (global as any).fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
    });

    mockedHandleAuthError.mockReturnValue(false);

    render(
        <MemoryRouter>
            <AdminDashboard />
        </MemoryRouter>
    );

    await waitFor(() => {
        expect(screen.getByText(/Error:/i)).toBeInTheDocument();
        expect(screen.getByText(/Server Error/i)).toBeInTheDocument();
    });

    expect(mockedHandleAuthError).toHaveBeenCalled();
});
