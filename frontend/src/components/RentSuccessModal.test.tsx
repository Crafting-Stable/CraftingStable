import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RentSuccessModal from './RentSuccessModal';
import type { RentCreatedData } from './PayPalCheckout';

describe('RentSuccessModal', () => {
    const mockOnClose = vi.fn();

    const mockRentData: RentCreatedData = {
        rentId: 123,
        toolId: 456,
        status: 'PENDING',
        startDate: '2025-01-15',
        endDate: '2025-01-20',
        totalPrice: 150.50,
        paypalOrderId: 'PAYPAL-ORDER-123456',
        paypalCaptureId: 'PAYPAL-CAPTURE-789012',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = (rentData: RentCreatedData | null = mockRentData, toolName?: string) => {
        return render(
            <RentSuccessModal
                rentData={rentData}
                toolName={toolName}
                onClose={mockOnClose}
            />
        );
    };

    describe('Rendering', () => {
        it('should return null when rentData is null', () => {
            const { container } = renderComponent(null);
            expect(container.firstChild).toBeNull();
        });

        it('should render modal when rentData is provided', () => {
            renderComponent();
            expect(screen.getByRole('dialog')).toBeDefined();
        });

        it('should render success title', () => {
            renderComponent();
            expect(screen.getByText('Reserva Criada com Sucesso!')).toBeDefined();
        });

        it('should render checkmark icon', () => {
            renderComponent();
            expect(screen.getByText('✓')).toBeDefined();
        });

        it('should render "Detalhes da Reserva" section title', () => {
            renderComponent();
            expect(screen.getByText('Detalhes da Reserva')).toBeDefined();
        });

        it('should render rent ID', () => {
            renderComponent();
            expect(screen.getByText('#123')).toBeDefined();
        });

        it('should render formatted dates', () => {
            renderComponent();
            // Portuguese locale format
            expect(screen.getByText(/15\/01\/2025/)).toBeDefined();
            expect(screen.getByText(/20\/01\/2025/)).toBeDefined();
        });

        it('should render total price with EUR', () => {
            renderComponent();
            expect(screen.getByText('150.50 EUR')).toBeDefined();
        });

        it('should render PENDING status with emoji', () => {
            renderComponent();
            expect(screen.getByText('🕐 Pendente')).toBeDefined();
        });

        it('should render non-PENDING status as is', () => {
            const confirmedData = { ...mockRentData, status: 'CONFIRMED' };
            renderComponent(confirmedData);
            expect(screen.getByText('CONFIRMED')).toBeDefined();
        });

        it('should render tool name when provided', () => {
            renderComponent(mockRentData, 'Electric Drill');
            expect(screen.getByText('Electric Drill')).toBeDefined();
        });

        it('should not render tool name row when not provided', () => {
            renderComponent(mockRentData, undefined);
            expect(screen.queryByText('Ferramenta:')).toBeNull();
        });
    });

    describe('Payment Information Section', () => {
        it('should render payment section title', () => {
            renderComponent();
            expect(screen.getByText('Informação do Pagamento')).toBeDefined();
        });

        it('should render PayPal order ID', () => {
            renderComponent();
            expect(screen.getByText('PAYPAL-ORDER-123456')).toBeDefined();
        });

        it('should render PayPal capture ID', () => {
            renderComponent();
            expect(screen.getByText('PAYPAL-CAPTURE-789012')).toBeDefined();
        });

        it('should render ID PayPal label', () => {
            renderComponent();
            expect(screen.getByText('ID PayPal:')).toBeDefined();
        });

        it('should render ID Captura label', () => {
            renderComponent();
            expect(screen.getByText('ID Captura:')).toBeDefined();
        });
    });

    describe('Notice Section', () => {
        it('should render awaiting approval notice', () => {
            renderComponent();
            expect(screen.getByText('⏳ Aguardando Aprovação')).toBeDefined();
        });

        it('should render notice description', () => {
            renderComponent();
            expect(screen.getByText(/O proprietário da ferramenta precisa aprovar/)).toBeDefined();
        });
    });

    describe('Close Button', () => {
        it('should render close button with correct text', () => {
            renderComponent();
            expect(screen.getByRole('button', { name: 'Ver Minhas Reservas' })).toBeDefined();
        });

        it('should call onClose when close button is clicked', () => {
            renderComponent();
            const closeButton = screen.getByRole('button', { name: 'Ver Minhas Reservas' });
            fireEvent.click(closeButton);
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });
    });

    describe('Backdrop Interactions', () => {
        it('should call onClose when overlay button is clicked', () => {
            renderComponent();
            const overlayButton = screen.getByLabelText('Fechar modal de reserva');
            fireEvent.click(overlayButton);
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it('should call onClose when clicking directly on dialog element', () => {
            renderComponent();
            const dialog = screen.getByRole('dialog');
            // Simulate clicking on the dialog element itself (backdrop area)
            fireEvent.click(dialog);
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it('should not close when clicking inside dialog content', () => {
            renderComponent();
            const title = screen.getByText('Reserva Criada com Sucesso!');
            fireEvent.click(title);
            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });

    describe('Keyboard Interactions', () => {
        it('should call onClose when Escape key is pressed', () => {
            renderComponent();
            fireEvent.keyDown(document, { key: 'Escape' });
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it('should not call onClose for other keys', () => {
            renderComponent();
            fireEvent.keyDown(document, { key: 'Enter' });
            fireEvent.keyDown(document, { key: 'Tab' });
            fireEvent.keyDown(document, { key: 'ArrowDown' });
            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it('should stop keyboard propagation on dialog keydown', () => {
            renderComponent();
            const dialog = screen.getByRole('dialog');
            const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            
            dialog.dispatchEvent(event);
            // The event is stopped inside the dialog
        });
    });

    describe('Accessibility', () => {
        it('should have aria-modal attribute', () => {
            renderComponent();
            const dialog = screen.getByRole('dialog');
            expect(dialog.getAttribute('aria-modal')).toBe('true');
        });

        it('should have aria-labelledby pointing to title', () => {
            renderComponent();
            const dialog = screen.getByRole('dialog');
            expect(dialog.getAttribute('aria-labelledby')).toBe('rent-success-title');
        });

        it('should have title with correct id', () => {
            renderComponent();
            const title = screen.getByText('Reserva Criada com Sucesso!');
            expect(title.id).toBe('rent-success-title');
        });

        it('should have overlay button with aria-label', () => {
            renderComponent();
            const overlayButton = screen.getByLabelText('Fechar modal de reserva');
            expect(overlayButton).toBeDefined();
        });

        it('should have checkmark hidden from screen readers', () => {
            renderComponent();
            const checkmark = screen.getByText('✓');
            expect(checkmark.getAttribute('aria-hidden')).toBe('true');
        });

        it('should have dialog open attribute', () => {
            renderComponent();
            const dialog = screen.getByRole('dialog');
            expect(dialog.hasAttribute('open')).toBe(true);
        });
    });

    describe('Focus Management', () => {
        it('should focus overlay button on mount', () => {
            renderComponent();
            const overlayButton = screen.getByLabelText('Fechar modal de reserva');
            // Button should be focused after render
            expect(document.activeElement).toBe(overlayButton);
        });
    });

    describe('Event Listener Cleanup', () => {
        it('should remove keydown listener on unmount', () => {
            const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
            const { unmount } = renderComponent();
            
            unmount();
            
            expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
            removeEventListenerSpy.mockRestore();
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero total price', () => {
            const freeRent = { ...mockRentData, totalPrice: 0 };
            renderComponent(freeRent);
            expect(screen.getByText('0.00 EUR')).toBeDefined();
        });

        it('should handle long PayPal IDs', () => {
            const longIdRent = {
                ...mockRentData,
                paypalOrderId: 'VERY-LONG-PAYPAL-ORDER-ID-' + 'X'.repeat(50),
            };
            renderComponent(longIdRent);
            expect(screen.getByText(longIdRent.paypalOrderId)).toBeDefined();
        });

        it('should handle very long tool names', () => {
            const longToolName = 'Super Professional Heavy Duty Industrial Grade Power Tool Set XL 3000';
            renderComponent(mockRentData, longToolName);
            expect(screen.getByText(longToolName)).toBeDefined();
        });

        it('should format large prices correctly', () => {
            const expensiveRent = { ...mockRentData, totalPrice: 99999.99 };
            renderComponent(expensiveRent);
            expect(screen.getByText('99999.99 EUR')).toBeDefined();
        });
    });
});
