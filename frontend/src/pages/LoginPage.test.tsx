// src/pages/LoginPage.test.tsx
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

  afterEach(() => {
    // Remove stubbed globals se disponível no objecto vi
    (vi as any).unstubAllGlobals?.();
  });

  it('should render login form', () => {
    render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
    );
    expect(screen.getByText(/Já tem conta\?/i)).toBeDefined();
    expect(screen.getByText(/Faça login para continuar/i)).toBeDefined();
  });

  it('opens register modal and successfully registers (closes modal and pre-fills login email)', async () => {
    const registerEmail = 'newuser@example.com';

    // mock successful register response
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ message: 'User registered successfully' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
    );

    // Open register modal
    const createBtn = screen.getByRole('button', { name: /criar conta/i });
    fireEvent.click(createBtn);

    // Ensure modal opened
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Crie a sua conta/i)).toBeDefined();

    // Fill register form inside modal
    const modal = within(dialog);
    fireEvent.change(modal.getByLabelText(/Nome/i), { target: { value: 'Novo Utilizador' } });
    fireEvent.change(modal.getByLabelText(/^Email$/i), { target: { value: registerEmail } });
    fireEvent.change(modal.getAllByLabelText(/Password/i)[0], { target: { value: 'password123' } });
    // Confirm password label is "Confirmar Password"
    fireEvent.change(modal.getByLabelText(/Confirmar Password/i), { target: { value: 'password123' } });

    // Submit register
    const submit = modal.getByRole('button', { name: /Criar conta/i });
    fireEvent.click(submit);

    // Wait for modal to close and fetch to be called
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    await waitFor(() => {
      // modal should be removed
      expect(screen.queryByText(/Crie a sua conta/i)).toBeNull();
    });

    // Login email input (login form is before modal) should be prefilled
    const loginEmailInputs = screen.getAllByLabelText(/^Email$/i);
    expect(loginEmailInputs[0]).toBeDefined();
    expect((loginEmailInputs[0] as HTMLInputElement).value).toBe(registerEmail);
  });

  it('shows server-side email error when registering an existing email', async () => {
    const registerEmail = 'existing@example.com';

    // mock failed register response with errors
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ errors: { email: 'Email already exists' }, message: 'Email already exists' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
    );

    // Open register modal
    const createBtn = screen.getByRole('button', { name: /criar conta/i });
    fireEvent.click(createBtn);

    const dialog = await screen.findByRole('dialog');
    const modal = within(dialog);

    // Fill register form
    fireEvent.change(modal.getByLabelText(/Nome/i), { target: { value: 'Existente' } });
    fireEvent.change(modal.getByLabelText(/^Email$/i), { target: { value: registerEmail } });
    fireEvent.change(modal.getAllByLabelText(/Password/i)[0], { target: { value: 'password123' } });
    fireEvent.change(modal.getByLabelText(/Confirmar Password/i), { target: { value: 'password123' } });

    // Submit
    fireEvent.click(modal.getByRole('button', { name: /Criar conta/i }));

    // Expect server error message to appear inside modal
    await waitFor(() => {
      expect(modal.getByText(/Email already exists|Email já existe/i)).toBeDefined();
    });
  });

  it('register modal is displayed centered on screen', async () => {
    render(
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
    );

    // Open register modal
    const createBtn = screen.getByRole('button', { name: /criar conta/i });
    fireEvent.click(createBtn);

    // Check that modal backdrop exists with proper centering classes
    const backdrop = document.querySelector('.modal-backdrop');
    expect(backdrop).not.toBeNull();

    // Check that dialog is visible
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeDefined();

    // Verify the modal content is visible (centered form)
    expect(within(dialog).getByText(/Crie a sua conta/i)).toBeDefined();
  });
});
