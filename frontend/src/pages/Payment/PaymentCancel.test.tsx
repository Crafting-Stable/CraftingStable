import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import PaymentCancel from './PaymentCancel';
import { BrowserRouter } from 'react-router-dom';

// Mock navigate
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock Header component
vi.mock('../../components/Header', () => ({
    default: () => <div data-testid="mock-header">Header</div>,
}));

describe('PaymentCancel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = () => {
        return render(
            <BrowserRouter>
                <PaymentCancel />
            </BrowserRouter>
        );
    };

    describe('Rendering', () => {
        it('should render the header component', () => {
            renderComponent();

            expect(screen.getByTestId('mock-header')).toBeDefined();
        });

        it('should render cancel icon with X symbol', () => {
            renderComponent();

            expect(screen.getByText('✕')).toBeDefined();
        });

        it('should render cancel title', () => {
            renderComponent();

            expect(screen.getByText('Payment Cancelled')).toBeDefined();
        });

        it('should render cancel message', () => {
            renderComponent();

            expect(screen.getByText(/Your payment was cancelled/i)).toBeDefined();
            expect(screen.getByText(/your rental request is still pending/i)).toBeDefined();
        });

        it('should render support note', () => {
            renderComponent();

            expect(screen.getByText(/Note:/i)).toBeDefined();
            expect(screen.getByText(/contact our support team/i)).toBeDefined();
        });

        it('should render Try Again button', () => {
            renderComponent();

            expect(screen.getByRole('button', { name: /Try Again/i })).toBeDefined();
        });

        it('should render View My Rentals button', () => {
            renderComponent();

            expect(screen.getByRole('button', { name: /View My Rentals/i })).toBeDefined();
        });

        it('should render Back to Home button', () => {
            renderComponent();

            expect(screen.getByRole('button', { name: /Back to Home/i })).toBeDefined();
        });
    });

    describe('Navigation', () => {
        it('should navigate back (-1) when Try Again is clicked', () => {
            renderComponent();

            const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
            fireEvent.click(tryAgainButton);

            expect(mockNavigate).toHaveBeenCalledWith(-1);
        });

        it('should navigate to /user when View My Rentals is clicked', () => {
            renderComponent();

            const viewRentalsButton = screen.getByRole('button', { name: /View My Rentals/i });
            fireEvent.click(viewRentalsButton);

            expect(mockNavigate).toHaveBeenCalledWith('/user');
        });

        it('should navigate to / when Back to Home is clicked', () => {
            renderComponent();

            const backHomeButton = screen.getByRole('button', { name: /Back to Home/i });
            fireEvent.click(backHomeButton);

            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    describe('Button Hover Effects - Try Again', () => {
        it('should apply hover styles on mouseOver for Try Again button', () => {
            renderComponent();

            const button = screen.getByRole('button', { name: /Try Again/i });
            fireEvent.mouseOver(button);

            expect(button.style.transform).toBe('translateY(-2px)');
            expect(button.style.boxShadow).toBe('0 4px 12px rgba(59, 130, 246, 0.4)');
        });

        it('should remove hover styles on mouseOut for Try Again button', () => {
            renderComponent();

            const button = screen.getByRole('button', { name: /Try Again/i });
            fireEvent.mouseOver(button);
            fireEvent.mouseOut(button);

            expect(button.style.transform).toBe('translateY(0)');
            expect(button.style.boxShadow).toBe('none');
        });

        it('should apply focus styles on focus for Try Again button', () => {
            renderComponent();

            const button = screen.getByRole('button', { name: /Try Again/i });
            fireEvent.focus(button);

            expect(button.style.transform).toBe('translateY(-2px)');
            expect(button.style.boxShadow).toBe('0 4px 12px rgba(59, 130, 246, 0.4)');
        });

        it('should remove focus styles on blur for Try Again button', () => {
            renderComponent();

            const button = screen.getByRole('button', { name: /Try Again/i });
            fireEvent.focus(button);
            fireEvent.blur(button);

            expect(button.style.transform).toBe('translateY(0)');
            expect(button.style.boxShadow).toBe('none');
        });
    });

    describe('Button Hover Effects - View My Rentals', () => {
        it('should apply hover styles on mouseOver for View My Rentals button', () => {
            renderComponent();

            const button = screen.getByRole('button', { name: /View My Rentals/i });
            fireEvent.mouseOver(button);

            expect(button.style.borderColor).toBe('#6b7280');
        });

        it('should remove hover styles on mouseOut for View My Rentals button', () => {
            renderComponent();

            const button = screen.getByRole('button', { name: /View My Rentals/i });
            fireEvent.mouseOver(button);
            fireEvent.mouseOut(button);

            expect(button.style.borderColor).toBe('#4b5563');
        });

        it('should apply focus styles on focus for View My Rentals button', () => {
            renderComponent();

            const button = screen.getByRole('button', { name: /View My Rentals/i });
            fireEvent.focus(button);

            expect(button.style.borderColor).toBe('#6b7280');
        });

        it('should remove focus styles on blur for View My Rentals button', () => {
            renderComponent();

            const button = screen.getByRole('button', { name: /View My Rentals/i });
            fireEvent.focus(button);
            fireEvent.blur(button);

            expect(button.style.borderColor).toBe('#4b5563');
        });
    });

    describe('Button Hover Effects - Back to Home', () => {
        it('should apply hover styles on mouseOver for Back to Home button', () => {
            renderComponent();

            const button = screen.getByRole('button', { name: /Back to Home/i });
            fireEvent.mouseOver(button);

            expect(button.style.borderColor).toBe('#6b7280');
        });

        it('should remove hover styles on mouseOut for Back to Home button', () => {
            renderComponent();

            const button = screen.getByRole('button', { name: /Back to Home/i });
            fireEvent.mouseOver(button);
            fireEvent.mouseOut(button);

            expect(button.style.borderColor).toBe('#4b5563');
        });

        it('should apply focus styles on focus for Back to Home button', () => {
            renderComponent();

            const button = screen.getByRole('button', { name: /Back to Home/i });
            fireEvent.focus(button);

            expect(button.style.borderColor).toBe('#6b7280');
        });

        it('should remove focus styles on blur for Back to Home button', () => {
            renderComponent();

            const button = screen.getByRole('button', { name: /Back to Home/i });
            fireEvent.focus(button);
            fireEvent.blur(button);

            expect(button.style.borderColor).toBe('#4b5563');
        });
    });

    describe('Accessibility', () => {
        it('should have all buttons keyboard accessible', () => {
            renderComponent();

            const buttons = screen.getAllByRole('button');
            expect(buttons).toHaveLength(3);
            
            buttons.forEach(button => {
                expect(button.tagName).toBe('BUTTON');
            });
        });
    });
});
