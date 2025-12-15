import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Header from './Header';
import { BrowserRouter } from 'react-router-dom';

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

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  const renderHeader = () => {
    return render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );
  };

  it('should render logo', () => {
    renderHeader();

    expect(screen.getByAltText('Crafting Stable logo')).toBeDefined();
  });

  it('should render logo text', () => {
    renderHeader();

    expect(screen.getByText('CraftingStable')).toBeDefined();
  });

  it('should show login button when not authenticated', () => {
    localStorageMock.getItem.mockReturnValue(null);

    renderHeader();

    expect(screen.getByText('Iniciar sessão')).toBeDefined();
  });

  it('should show user avatar initial when authenticated', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'jwt') return 'mock-jwt-token';
      if (key === 'user') return JSON.stringify({ username: 'JohnDoe', role: 'CUSTOMER' });
      return null;
    });

    renderHeader();

    expect(screen.getByText('J')).toBeDefined(); // First letter of JohnDoe
  });

  it('should show logout button when authenticated', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'jwt') return 'mock-jwt-token';
      if (key === 'user') return JSON.stringify({ username: 'JohnDoe', role: 'CUSTOMER' });
      return null;
    });

    renderHeader();

    expect(screen.getByText('Sair')).toBeDefined();
  });

  it('should navigate to home on logout', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'jwt') return 'mock-jwt-token';
      if (key === 'user') return JSON.stringify({ username: 'JohnDoe', role: 'CUSTOMER' });
      return null;
    });

    renderHeader();

    const logoutButton = screen.getByText('Sair');
    fireEvent.click(logoutButton);

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('jwt');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should show navigation links', () => {
    renderHeader();

    expect(screen.getByText('Catálogo')).toBeDefined();
    expect(screen.getByText('Sobre')).toBeDefined();
  });

  it('should show admin link for admin users', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'jwt') return 'mock-jwt-token';
      if (key === 'user') return JSON.stringify({ username: 'Admin', role: 'ADMIN' });
      return null;
    });

    renderHeader();

    expect(screen.getByText('Admin')).toBeDefined();
  });

  it('should show Add Rent link for customer users', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'jwt') return 'mock-jwt-token';
      if (key === 'user') return JSON.stringify({ username: 'Customer', role: 'CUSTOMER' });
      return null;
    });

    renderHeader();

    expect(screen.getByText('Add Rent')).toBeDefined();
  });

  it('should show user avatar initial', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'jwt') return 'mock-jwt-token';
      if (key === 'user') return JSON.stringify({ username: 'TestUser', role: 'CUSTOMER' });
      return null;
    });

    renderHeader();

    expect(screen.getByText('T')).toBeDefined(); // First letter of TestUser
  });

  it('should handle invalid user JSON gracefully', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'jwt') return 'mock-jwt-token';
      if (key === 'user') return 'invalid-json';
      return null;
    });

    renderHeader();

    // Should show login button as fallback
    expect(screen.getByText('Iniciar sessão')).toBeDefined();
  });
});
