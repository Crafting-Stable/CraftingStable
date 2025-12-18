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

test('mostra calendário de disponibilidade nas Minhas Ferramentas', async () => {
    localStorage.setItem('jwt', 'fake-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, username: 'Carlos', email: 'carlos@example.com' }));

    // Current month dates for testing
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');

    (global as any).fetch = vi.fn((input: RequestInfo) => {
        const url = String(input);
        if (url.includes('/api/rents')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([
                    {
                        id: 30,
                        toolId: 300,
                        userId: 2,
                        status: 'APPROVED',
                        startDate: `${year}-${month}-15`,
                        endDate: `${year}-${month}-18`,
                        message: ''
                    }
                ])
            });
        }

        if (url.includes('/api/tools')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([
                    { id: 300, name: 'Berbequim Pro', ownerId: 1, status: 'AVAILABLE' }
                ])
            });
        }

        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 1, username: 'Carlos', email: 'carlos@example.com', role: 'Utilizador' })
        });
    });

    render(
        <MemoryRouter>
            <UserDetailsPage />
        </MemoryRouter>
    );

    // Espera pelo carregamento
    await screen.findByText(/Carlos/);

    // Clica na aba de Minhas Ferramentas
    const ferramentasTab = screen.getByRole('button', { name: /🛠️ Minhas Ferramentas \(1\)/i });
    await userEvent.click(ferramentasTab);

    // Verifica que a ferramenta é exibida
    await screen.findByText(/Berbequim Pro/);

    // Verifica que o botão de Ver Disponibilidade está presente
    const calendarButton = screen.getByRole('button', { name: /Ver Disponibilidade/i });
    expect(calendarButton).toBeInTheDocument();

    // Clica para mostrar o calendário
    await userEvent.click(calendarButton);

    // Verifica que o calendário é exibido com a legenda
    expect(screen.getByText('Disponível')).toBeInTheDocument();
    expect(screen.getByText('Alugado')).toBeInTheDocument();

    // Verifica que os cabeçalhos dos dias da semana estão presentes
    expect(screen.getByText('Seg')).toBeInTheDocument();
    expect(screen.getByText('Ter')).toBeInTheDocument();
    expect(screen.getByText('Qua')).toBeInTheDocument();
    expect(screen.getByText('Qui')).toBeInTheDocument();
    expect(screen.getByText('Sex')).toBeInTheDocument();
    expect(screen.getByText('Sáb')).toBeInTheDocument();
    expect(screen.getByText('Dom')).toBeInTheDocument();

    // Verifica botões de navegação do mês
    expect(screen.getByLabelText('Mês anterior')).toBeInTheDocument();
    expect(screen.getByLabelText('Próximo mês')).toBeInTheDocument();

    // Clica para ocultar o calendário
    const hideButton = screen.getByRole('button', { name: /Ocultar Calendário/i });
    await userEvent.click(hideButton);

    // Verifica que a legenda não está mais visível
    expect(screen.queryByText('Disponível')).not.toBeInTheDocument();
});

test('calendário navega entre meses', async () => {
    localStorage.setItem('jwt', 'fake-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, username: 'Ana', email: 'ana@example.com' }));

    (global as any).fetch = vi.fn((input: RequestInfo) => {
        const url = String(input);
        if (url.includes('/api/rents')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([])
            });
        }

        if (url.includes('/api/tools')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([
                    { id: 400, name: 'Martelo', ownerId: 1, status: 'AVAILABLE' }
                ])
            });
        }

        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: 1, username: 'Ana', email: 'ana@example.com', role: 'Utilizador' })
        });
    });

    render(
        <MemoryRouter>
            <UserDetailsPage />
        </MemoryRouter>
    );

    await screen.findByText(/Ana/);

    // Ir para aba de ferramentas
    const ferramentasTab = screen.getByRole('button', { name: /🛠️ Minhas Ferramentas \(1\)/i });
    await userEvent.click(ferramentasTab);
    await screen.findByText(/Martelo/);

    // Abrir calendário
    const calendarButton = screen.getByRole('button', { name: /Ver Disponibilidade/i });
    await userEvent.click(calendarButton);

    // Verifica o mês atual no calendário
    const currentMonth = new Date();
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const currentMonthName = monthNames[currentMonth.getMonth()];
    
    expect(screen.getByText(new RegExp(currentMonthName))).toBeInTheDocument();

    // Navegar para o próximo mês
    const nextButton = screen.getByLabelText('Próximo mês');
    await userEvent.click(nextButton);

    // Verifica que o mês mudou
    const nextMonthIndex = (currentMonth.getMonth() + 1) % 12;
    const nextMonthName = monthNames[nextMonthIndex];
    expect(screen.getByText(new RegExp(nextMonthName))).toBeInTheDocument();

    // Navegar para o mês anterior (volta ao atual)
    const prevButton = screen.getByLabelText('Mês anterior');
    await userEvent.click(prevButton);

    // Verifica que voltou ao mês atual
    expect(screen.getByText(new RegExp(currentMonthName))).toBeInTheDocument();
});
