import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import PaymentSuccess from './PaymentSuccess';
import { BrowserRouter, useSearchParams } from 'react-router-dom';

// Mock navigate
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useSearchParams: vi.fn(),
    };
});

// Mock Header component
vi.mock('../../components/Header', () => ({
    default: () => <div data-testid="mock-header">Header</div>,
}));

describe('PaymentSuccess', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockSearchParams = (params: Record<string, string | null>) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null) {
                searchParams.set(key, value);
            }
        });
        (useSearchParams as Mock).mockReturnValue([searchParams]);
    };

    const renderComponent = () => {
        return render(
            <BrowserRouter>
                <PaymentSuccess />
            </BrowserRouter>
        );
    };

    describe('Rendering', () => {
        it('should render the header component', () => {
            mockSearchParams({});
            renderComponent();

            expect(screen.getByTestId('mock-header')).toBeDefined();
        });

        it('should render success icon with checkmark', () => {
            mockSearchParams({});
            renderComponent();

            expect(screen.getByText('✓')).toBeDefined();
        });

        it('should render success title', () => {
            mockSearchParams({});
            renderComponent();

            expect(screen.getByText('Payment Successful!')).toBeDefined();
        });

        it('should render success message', () => {
            mockSearchParams({});
            renderComponent();

            expect(screen.getByText(/Thank you for your payment/i)).toBeDefined();
            expect(screen.getByText(/Your rental has been confirmed/i)).toBeDefined();
        });

        it('should render View My Rentals button', () => {
            mockSearchParams({});
            renderComponent();

            expect(screen.getByRole('button', { name: /View My Rentals/i })).toBeDefined();
        });

        it('should render Back to Home button', () => {
            mockSearchParams({});
            renderComponent();

            expect(screen.getByRole('button', { name: /Back to Home/i })).toBeDefined();
        });
    });

    describe('URL Parameters Handling', () => {
        it('should display transaction ID when token is present in URL', () => {
            const testToken = 'TEST-ORDER-12345';
            mockSearchParams({ token: testToken });
            renderComponent();

            expect(screen.getByText('Transaction ID:')).toBeDefined();
            expect(screen.getByText(testToken)).toBeDefined();
        });

        it('should not display transaction section when token is absent', () => {
            mockSearchParams({});
            renderComponent();

            expect(screen.queryByText('Transaction ID:')).toBeNull();
        });

        it('should handle all payment details from URL params', () => {
            mockSearchParams({
                token: 'ORDER-123',
                rentId: 'RENT-456',
                amount: '99.99',
            });
            renderComponent();

            expect(screen.getByText('ORDER-123')).toBeDefined();
        });

        it('should handle empty search params gracefully', () => {
            mockSearchParams({
                token: null,
                rentId: null,
                amount: null,
            });
            renderComponent();

            expect(screen.queryByText('Transaction ID:')).toBeNull();
            // Component should still render without errors
            expect(screen.getByText('Payment Successful!')).toBeDefined();
        });
    });

    describe('Navigation', () => {
        it('should navigate to /user when View My Rentals is clicked', () => {
            mockSearchParams({});
            renderComponent();

            const viewRentalsButton = screen.getByRole('button', { name: /View My Rentals/i });
            fireEvent.click(viewRentalsButton);

            expect(mockNavigate).toHaveBeenCalledWith('/user');
        });

        it('should navigate to / when Back to Home is clicked', () => {
            mockSearchParams({});
            renderComponent();

            const backHomeButton = screen.getByRole('button', { name: /Back to Home/i });
            fireEvent.click(backHomeButton);

            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    describe('Button Hover Effects - View My Rentals', () => {
        it('should apply hover styles on mouseOver for View My Rentals button', () => {
            mockSearchParams({});
            renderComponent();

            const button = screen.getByRole('button', { name: /View My Rentals/i });
            fireEvent.mouseOver(button);

            expect(button.style.transform).toBe('translateY(-2px)');
            expect(button.style.boxShadow).toBe('0 4px 12px rgba(59, 130, 246, 0.4)');
        });

        it('should remove hover styles on mouseOut for View My Rentals button', () => {
            mockSearchParams({});
            renderComponent();

            const button = screen.getByRole('button', { name: /View My Rentals/i });
            fireEvent.mouseOver(button);
            fireEvent.mouseOut(button);

            expect(button.style.transform).toBe('translateY(0)');
            expect(button.style.boxShadow).toBe('none');
        });

        it('should apply focus styles on focus for View My Rentals button', () => {
            mockSearchParams({});
            renderComponent();

            const button = screen.getByRole('button', { name: /View My Rentals/i });
            fireEvent.focus(button);

            expect(button.style.transform).toBe('translateY(-2px)');
            expect(button.style.boxShadow).toBe('0 4px 12px rgba(59, 130, 246, 0.4)');
        });

        it('should remove focus styles on blur for View My Rentals button', () => {
            mockSearchParams({});
            renderComponent();

            const button = screen.getByRole('button', { name: /View My Rentals/i });
            fireEvent.focus(button);
            fireEvent.blur(button);

            expect(button.style.transform).toBe('translateY(0)');
            expect(button.style.boxShadow).toBe('none');
        });
    });

    describe('Button Hover Effects - Back to Home', () => {
        it('should apply hover styles on mouseOver for Back to Home button', () => {
            mockSearchParams({});
            renderComponent();

            const button = screen.getByRole('button', { name: /Back to Home/i });
            fireEvent.mouseOver(button);

            expect(button.style.borderColor).toBe('#6b7280');
        });

        it('should remove hover styles on mouseOut for Back to Home button', () => {
            mockSearchParams({});
            renderComponent();

            const button = screen.getByRole('button', { name: /Back to Home/i });
            fireEvent.mouseOver(button);
            fireEvent.mouseOut(button);

            expect(button.style.borderColor).toBe('#4b5563');
        });

        it('should apply focus styles on focus for Back to Home button', () => {
            mockSearchParams({});
            renderComponent();

            const button = screen.getByRole('button', { name: /Back to Home/i });
            fireEvent.focus(button);

            expect(button.style.borderColor).toBe('#6b7280');
        });

        it('should remove focus styles on blur for Back to Home button', () => {
            mockSearchParams({});
            renderComponent();

            const button = screen.getByRole('button', { name: /Back to Home/i });
            fireEvent.focus(button);
            fireEvent.blur(button);

            expect(button.style.borderColor).toBe('#4b5563');
        });
    });

    describe('Edge Cases', () => {
        it('should handle very long transaction IDs', () => {
            const longToken = 'A'.repeat(100);
            mockSearchParams({ token: longToken });
            renderComponent();

            expect(screen.getByText(longToken)).toBeDefined();
        });

        it('should handle special characters in transaction ID', () => {
            const specialToken = 'ORDER-123_ABC-XYZ!@#$%';
            mockSearchParams({ token: specialToken });
            renderComponent();

            expect(screen.getByText(specialToken)).toBeDefined();
        });
    });
});
