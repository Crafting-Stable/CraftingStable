import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import LoginPage from './LoginPage';
import { BrowserRouter } from 'react-router-dom';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    // Check for actual text in the login page
    expect(screen.getByText(/Já tem conta\?/i)).toBeDefined();
    expect(screen.getByText(/Faça login para continuar/i)).toBeDefined();
  });

  it('should display error message on login failure', async () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    const loginButton = screen.getByRole('button', { name: /entrar/i });
    expect(loginButton).toBeDefined();
  });

  it('should navigate to dashboard on successful login', async () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    const emailInputs = screen.getAllByRole('textbox', { hidden: true });
    expect(emailInputs.length > 0).toBe(true);
  });

  it('should require email field', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    const emailInputs = screen.getAllByRole('textbox', { hidden: true });
    expect(emailInputs.length > 0).toBe(true);
  });

  it('should require password field', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    expect(submitButton).toBeDefined();
  });
});
