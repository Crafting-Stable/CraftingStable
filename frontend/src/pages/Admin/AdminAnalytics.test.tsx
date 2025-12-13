import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import AdminAnalytics from './AdminAnalytics';
import { BrowserRouter } from 'react-router-dom';

// Mock the adminUtils module
vi.mock('./adminUtils', () => ({
  apiUrl: (path: string) => `http://localhost:8081${path}`,
  getJwt: () => 'mock-jwt-token',
  handleAuthError: vi.fn(() => false),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AdminAnalytics', () => {
  const mockAnalyticsSummary = {
    uniqueUsers: 150,
    totalEvents: 2500,
    eventsByType: {
      PAGE_VIEW: 1200,
      TOOL_VIEW: 800,
      SEARCH: 500,
    },
    topTools: [
      { toolId: 1, views: 245 },
      { toolId: 2, views: 180 },
      { toolId: 3, views: 120 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it('should show loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <BrowserRouter>
        <AdminAnalytics />
      </BrowserRouter>
    );

    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('should display analytics data after successful fetch', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalyticsSummary,
    });

    render(
      <BrowserRouter>
        <AdminAnalytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('150')).toBeDefined(); // uniqueUsers
    });

    expect(screen.getByText('2500')).toBeDefined(); // totalEvents
    expect(screen.getByText('Unique Users')).toBeDefined();
    expect(screen.getByText('Total Events')).toBeDefined();
  });

  it('should show error state when fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    render(
      <BrowserRouter>
        <AdminAnalytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeDefined();
    });
  });

  it('should display navigation links', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalyticsSummary,
    });

    render(
      <BrowserRouter>
        <AdminAnalytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Analytics')).toBeDefined();
    });

    expect(screen.getByText('Dashboard')).toBeDefined();
    expect(screen.getByText('Users')).toBeDefined();
    expect(screen.getByText('Tools')).toBeDefined();
    expect(screen.getByText('Home')).toBeDefined();
  });

  it('should display time range selector buttons', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalyticsSummary,
    });

    render(
      <BrowserRouter>
        <AdminAnalytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Last 7 days')).toBeDefined();
    });

    expect(screen.getByText('Last 30 days')).toBeDefined();
    expect(screen.getByText('Last 90 days')).toBeDefined();
  });

  it('should change time range when clicking buttons', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockAnalyticsSummary,
    });

    render(
      <BrowserRouter>
        <AdminAnalytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Last 7 days')).toBeDefined();
    });

    const sevenDaysButton = screen.getByText('Last 7 days');
    fireEvent.click(sevenDaysButton);

    // Should trigger another fetch
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('should display events by type section', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalyticsSummary,
    });

    render(
      <BrowserRouter>
        <AdminAnalytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Events by Type')).toBeDefined();
    });

    expect(screen.getAllByText('PAGE VIEW').length).toBeGreaterThan(0);
    expect(screen.getAllByText('TOOL VIEW').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1200').length).toBeGreaterThan(0);
    expect(screen.getAllByText('800').length).toBeGreaterThan(0);
  });

  it('should display most viewed tools table', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalyticsSummary,
    });

    render(
      <BrowserRouter>
        <AdminAnalytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Most Viewed Tools')).toBeDefined();
    });

    expect(screen.getByText('Rank')).toBeDefined();
    expect(screen.getByText('Tool ID')).toBeDefined();
    expect(screen.getByText('Views')).toBeDefined();
    expect(screen.getByText('#1')).toBeDefined();
    expect(screen.getByText('245')).toBeDefined();
  });

  it('should show no data message when no events', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        uniqueUsers: 0,
        totalEvents: 0,
        eventsByType: {},
        topTools: [],
      }),
    });

    render(
      <BrowserRouter>
        <AdminAnalytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No events recorded in this period')).toBeDefined();
    });
  });

  it('should show no tools message when no tool views', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        uniqueUsers: 10,
        totalEvents: 50,
        eventsByType: { PAGE_VIEW: 50 },
        topTools: [],
      }),
    });

    render(
      <BrowserRouter>
        <AdminAnalytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No tool views recorded in this period')).toBeDefined();
    });
  });

  it('should display event distribution chart when events exist', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnalyticsSummary,
    });

    render(
      <BrowserRouter>
        <AdminAnalytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Event Distribution')).toBeDefined();
    });
  });

  it('should handle 401 authentication error', async () => {
    const { handleAuthError } = await import('./adminUtils');
    (handleAuthError as Mock).mockReturnValueOnce(true);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });

    render(
      <BrowserRouter>
        <AdminAnalytics />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(handleAuthError).toHaveBeenCalledWith(401, 'Unauthorized', mockNavigate, expect.any(Function));
    });
  });
});
