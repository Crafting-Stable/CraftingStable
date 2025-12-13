import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import AdminTools from './AdminTools';
import { BrowserRouter } from 'react-router-dom';

// Mock adminUtils - correct path: the component imports from './adminUtils'
const mockGetJwt = vi.fn();
const mockHandleAuthError = vi.fn();
const mockApiUrl = vi.fn();

vi.mock('./adminUtils', () => ({
  getJwt: () => mockGetJwt(),
  handleAuthError: (status: number, text: string, navigate: Function, setError: Function) => mockHandleAuthError(status, text, navigate, setError),
  apiUrl: (path: string) => mockApiUrl(path),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock navigate
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock window functions
global.alert = vi.fn();
global.confirm = vi.fn();

describe('AdminTools', () => {
  const mockTools = [
    {
      id: 1,
      name: 'Martelo',
      type: 'Ferramentas Manuais',
      dailyPrice: 5.99,
      depositAmount: 20,
      description: 'Martelo profissional',
      location: 'Aveiro',
      status: 'AVAILABLE',
      available: true,
      ownerId: 1,
    },
    {
      id: 2,
      name: 'Berbequim',
      type: 'Elétricas',
      dailyPrice: 15.99,
      depositAmount: 50,
      description: 'Berbequim elétrico',
      location: 'Porto',
      status: 'RENTED',
      available: false,
      ownerId: 2,
    },
    {
      id: 3,
      name: 'Serra Circular',
      type: 'Carpintaria',
      dailyPrice: 25.00,
      depositAmount: 100,
      description: 'Serra circular',
      location: 'Lisboa',
      status: 'UNDER_MAINTENANCE',
      available: false,
      ownerId: 1,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockGetJwt.mockReturnValue('mock-jwt-token');
    mockApiUrl.mockImplementation((path) => `http://localhost:8080${path}`);
    mockHandleAuthError.mockReturnValue(false);
    (global.confirm as Mock).mockReturnValue(true);
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AdminTools />
      </BrowserRouter>
    );
  };

  it('should render the page with header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockTools,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Tool Management')).toBeDefined();
    });
  });

  it('should load and display all tools', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockTools,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Martelo')).toBeDefined();
    });

    expect(screen.getByText('Berbequim')).toBeDefined();
    expect(screen.getByText('Serra Circular')).toBeDefined();
  });

  it('should show loading state', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    renderComponent();

    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('should display filter buttons', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockTools,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('All')).toBeDefined();
    });

    // These filter buttons exist but AVAILABLE/RENTED also appear in status select options
    // Use getAllByText and check that there's at least one button
    expect(screen.getAllByText('AVAILABLE').length).toBeGreaterThan(0);
    expect(screen.getAllByText('RENTED').length).toBeGreaterThan(0);
    expect(screen.getAllByText('UNDER_MAINTENANCE').length).toBeGreaterThan(0);
  });

  it('should filter tools by AVAILABLE status', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockTools,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Martelo')).toBeDefined();
    });

    // Get the filter button by role and name
    const availableButton = screen.getByRole('button', { name: 'AVAILABLE' });
    fireEvent.click(availableButton);

    await waitFor(() => {
      expect(screen.getByText('Martelo')).toBeDefined();
    });

    // Rented and maintenance tools should be filtered out
    expect(screen.queryByText('Berbequim')).toBeNull();
    expect(screen.queryByText('Serra Circular')).toBeNull();
  });

  it('should filter tools by RENTED status', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockTools,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Berbequim')).toBeDefined();
    });

    const rentedButton = screen.getByRole('button', { name: 'RENTED' });
    fireEvent.click(rentedButton);

    await waitFor(() => {
      expect(screen.getByText('Berbequim')).toBeDefined();
    });

    expect(screen.queryByText('Martelo')).toBeNull();
  });

  it('should filter tools by MAINTENANCE status', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockTools,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Serra Circular')).toBeDefined();
    });

    const maintenanceButton = screen.getByRole('button', { name: 'UNDER_MAINTENANCE' });
    fireEvent.click(maintenanceButton);

    await waitFor(() => {
      expect(screen.getByText('Serra Circular')).toBeDefined();
    });

    expect(screen.queryByText('Martelo')).toBeNull();
    expect(screen.queryByText('Berbequim')).toBeNull();
  });

  it('should show all tools when clicking "Todas"', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockTools,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Martelo')).toBeDefined();
    });

    // First filter
    const rentedButton = screen.getByRole('button', { name: 'RENTED' });
    fireEvent.click(rentedButton);

    // Then show all
    const allButton = screen.getByRole('button', { name: 'All' });
    fireEvent.click(allButton);

    await waitFor(() => {
      expect(screen.getByText('Martelo')).toBeDefined();
      expect(screen.getByText('Berbequim')).toBeDefined();
      expect(screen.getByText('Serra Circular')).toBeDefined();
    });
  });

  it('should update tool status', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockTools })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...mockTools[0], status: 'MAINTENANCE' }) });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Martelo')).toBeDefined();
    });

    // Find status select for first tool
    const statusSelects = screen.getAllByRole('combobox');
    fireEvent.change(statusSelects[0], { target: { value: 'MAINTENANCE' } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tools/1/status'),
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });
  });

  it('should open edit modal when clicking edit button', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => mockTools });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Martelo')).toBeDefined();
    });

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Edit Tool #/)).toBeDefined();
    });
  });

  it('should close modal when clicking close button', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => mockTools });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Martelo')).toBeDefined();
    });

    // Open modal
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Edit Tool #/)).toBeDefined();
    });

    // Close modal
    const closeButton = screen.getByText('Cancel');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText(/Edit Tool #/)).toBeNull();
    });
  });

  it('should close modal with Escape key', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => mockTools });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Martelo')).toBeDefined();
    });

    // Open modal
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Edit Tool #/)).toBeDefined();
    });

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText(/Edit Tool #/)).toBeNull();
    });
  });

  it('should save edited tool', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockTools })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...mockTools[0], name: 'Martelo Editado' }) });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Martelo')).toBeDefined();
    });

    // Open modal
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Edit Tool #/)).toBeDefined();
    });

    // Edit name
    const nameInput = screen.getByDisplayValue('Martelo') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Martelo Editado' } });

    // Save
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Ferramenta atualizada com sucesso!');
    });
  });

  it('should delete tool with confirmation', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockTools })
      .mockResolvedValueOnce({ ok: true });

    (global.confirm as Mock).mockReturnValue(true);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Martelo')).toBeDefined();
    });

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith('Ferramenta apagada com sucesso!');
    });
  });

  it('should not delete tool when confirmation is cancelled', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => mockTools });

    (global.confirm as Mock).mockReturnValue(false);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Martelo')).toBeDefined();
    });

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    // Should only have been called once for initial fetch
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle API error when fetching tools', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
      statusText: 'Internal Server Error',
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch tools|Error|Internal Server Error/)).toBeDefined();
    });
  });

  it('should handle authentication error', async () => {
    mockHandleAuthError.mockReturnValue(true);
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    renderComponent();

    await waitFor(() => {
      expect(mockHandleAuthError).toHaveBeenCalled();
    });
  });

  it('should display tool details in table', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => mockTools });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Martelo')).toBeDefined();
    });

    // Check table headers
    expect(screen.getByText('ID')).toBeDefined();
    expect(screen.getByText('Name')).toBeDefined();
    expect(screen.getByText('Type')).toBeDefined();
    expect(screen.getByText('Price/day')).toBeDefined();
    expect(screen.getByText('Location')).toBeDefined();
    expect(screen.getByText('Status')).toBeDefined();
    expect(screen.getByText('Actions')).toBeDefined();
  });

  it('should display tool prices correctly', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => mockTools });

    renderComponent();

    await waitFor(() => {
      // Prices are displayed without toFixed formatting
      expect(screen.getByText('€5.99')).toBeDefined();
      expect(screen.getByText('€15.99')).toBeDefined();
      expect(screen.getByText('€25')).toBeDefined(); // 25.00 is displayed as 25
    });
  });

  it('should show empty state when no tools', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] });

    renderComponent();

    await waitFor(() => {
      // When no tools, the table should show 0 tools count
      expect(screen.getByText('0 tools')).toBeDefined();
    });
  });

  it('should show empty state when filter returns no results', async () => {
    const onlyAvailableTools = [mockTools[0]];
    mockFetch.mockResolvedValue({ ok: true, json: async () => onlyAvailableTools });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Martelo')).toBeDefined();
    });

    // Filter by maintenance (none exist)
    const maintenanceButton = screen.getByRole('button', { name: 'UNDER_MAINTENANCE' });
    fireEvent.click(maintenanceButton);

    await waitFor(() => {
      expect(screen.getByText('0 tools')).toBeDefined();
    });
  });

  it('should handle status update error', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockTools })
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Error', statusText: 'Error' });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Martelo')).toBeDefined();
    });

    const statusSelects = screen.getAllByRole('combobox');
    fireEvent.change(statusSelects[0], { target: { value: 'UNDER_MAINTENANCE' } });

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(expect.stringMatching(/Failed to update tool status|Error/));
    });
  });

  it('should handle delete error', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockTools })
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Error', statusText: 'Error' });

    (global.confirm as Mock).mockReturnValue(true);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Martelo')).toBeDefined();
    });

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(expect.stringMatching(/Failed to delete tool|Error/));
    });
  });

  it('should display total tools count', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => mockTools });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('3 tools')).toBeDefined();
    });
  });

  it('should edit all fields in modal', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockTools })
      .mockResolvedValueOnce({ ok: true, json: async () => mockTools[0] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Martelo')).toBeDefined();
    });

    // Open modal
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Edit Tool #/)).toBeDefined();
    });

    // Find and edit all fields
    const inputs = screen.getAllByRole('textbox');
    const priceInputs = screen.getAllByRole('spinbutton');

    // Edit description
    const descriptionInput = inputs.find(i => (i as HTMLInputElement).value === 'Martelo profissional');
    if (descriptionInput) {
      fireEvent.change(descriptionInput, { target: { value: 'Nova descrição' } });
    }

    // Edit price
    const priceInput = priceInputs[0];
    if (priceInput) {
      fireEvent.change(priceInput, { target: { value: '10' } });
    }
  });

  it('should handle save edit error', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockTools })
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Error', statusText: 'Error' });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Martelo')).toBeDefined();
    });

    // Open modal
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Edit Tool #/)).toBeDefined();
    });

    // Save
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(expect.stringMatching(/Failed to update tool|Error/));
    });
  });

  it('should navigate to dashboard button', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => mockTools });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Martelo')).toBeDefined();
    });

    const dashboardLink = screen.getByText('Dashboard');
    expect(dashboardLink).toBeDefined();
  });
});
