import React, { useEffect, useRef } from 'react';
import type { RentCreatedData } from './PayPalCheckout';

interface RentSuccessModalProps {
    rentData: RentCreatedData | null;
    toolName?: string;
    onClose: () => void;
}

const RentSuccessModal: React.FC<RentSuccessModalProps> = ({ rentData, toolName, onClose }) => {
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const titleId = 'rent-success-title';

    useEffect(() => {
        overlayRef.current?.focus();

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    if (!rentData) return null;

    const startDate = new Date(rentData.startDate).toLocaleDateString('pt-PT');
    const endDate = new Date(rentData.endDate).toLocaleDateString('pt-PT');

    const handleOverlayKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            onClose();
        }
    };

    return (
        <div
            ref={overlayRef}
            style={styles.overlay}
            onClick={onClose}
            onKeyDown={handleOverlayKeyDown}
            role="button"
            tabIndex={0}
            aria-label="Fechar modal de reserva"
        >
            <div
                style={styles.modal}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
            >
                <div style={styles.header}>
                    <div style={styles.checkmark} aria-hidden="true">✓</div>
                    <h2 id={titleId} style={styles.title}>Reserva Criada com Sucesso!</h2>
                </div>

                {/* resto do conteúdo permanece igual */}
                <div style={styles.content}>
                    <div style={styles.infoSection}>
                        <h3 style={styles.sectionTitle}>Detalhes da Reserva</h3>

                        <div style={styles.infoRow}>
                            <span style={styles.label}>ID da Reserva:</span>
                            <span style={styles.value}>#{rentData.rentId}</span>
                        </div>

                        {toolName && (
                            <div style={styles.infoRow}>
                                <span style={styles.label}>Ferramenta:</span>
                                <span style={styles.value}>{toolName}</span>
                            </div>
                        )}

                        <div style={styles.infoRow}>
                            <span style={styles.label}>Período:</span>
                            <span style={styles.value}>{startDate} - {endDate}</span>
                        </div>

                        <div style={styles.infoRow}>
                            <span style={styles.label}>Valor Pago:</span>
                            <span style={styles.value}>
                                {rentData.totalPrice.toFixed(2)} EUR
                            </span>
                        </div>

                        <div style={styles.infoRow}>
                            <span style={styles.label}>Estado:</span>
                            <span style={{ ...styles.value, ...styles.statusBadge }}>
                                {rentData.status === 'PENDING' ? '🕐 Pendente' : rentData.status}
                            </span>
                        </div>
                    </div>

                    <div style={styles.paymentSection}>
                        <h3 style={styles.sectionTitle}>Informação do Pagamento</h3>

                        <div style={styles.infoRow}>
                            <span style={styles.label}>ID PayPal:</span>
                            <span style={{ ...styles.value, fontSize: 12, fontFamily: 'monospace' }}>
                                {rentData.paypalOrderId}
                            </span>
                        </div>

                        <div style={styles.infoRow}>
                            <span style={styles.label}>ID Captura:</span>
                            <span style={{ ...styles.value, fontSize: 12, fontFamily: 'monospace' }}>
                                {rentData.paypalCaptureId}
                            </span>
                        </div>
                    </div>

                    <div style={styles.notice}>
                        <strong>⏳ Aguardando Aprovação</strong>
                        <p style={{ margin: '8px 0 0 0', fontSize: 14 }}>
                            O proprietário da ferramenta precisa aprovar a sua reserva.
                            Você será notificado quando a decisão for tomada.
                        </p>
                    </div>
                </div>

                <div style={styles.footer}>
                    <button onClick={onClose} style={styles.closeButton}>
                        Ver Minhas Reservas
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
        // permitir foco visível
        outline: 'none',
    },
    modal: {
        backgroundColor: '#1f2937',
        borderRadius: 12,
        maxWidth: 600,
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    },
    header: {
        backgroundColor: '#22c55e',
        padding: '32px 24px',
        textAlign: 'center',
        borderRadius: '12px 12px 0 0',
    },
    checkmark: {
        width: 64,
        height: 64,
        borderRadius: '50%',
        backgroundColor: '#fff',
        color: '#22c55e',
        fontSize: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
        fontWeight: 'bold',
    },
    title: {
        margin: 0,
        color: '#fff',
        fontSize: 24,
        fontWeight: 700,
    },
    content: {
        padding: 24,
    },
    infoSection: {
        marginBottom: 24,
    },
    paymentSection: {
        marginBottom: 24,
        paddingTop: 20,
        borderTop: '1px solid #374151',
    },
    sectionTitle: {
        color: '#f3f4f6',
        fontSize: 16,
        fontWeight: 600,
        marginBottom: 16,
        marginTop: 0,
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        gap: 16,
    },
    label: {
        color: '#9ca3af',
        fontSize: 14,
        fontWeight: 500,
    },
    value: {
        color: '#f3f4f6',
        fontSize: 14,
        fontWeight: 600,
        textAlign: 'right',
        wordBreak: 'break-word',
    },
    statusBadge: {
        backgroundColor: '#fbbf24',
        color: '#78350f',
        padding: '4px 12px',
        borderRadius: 12,
        fontSize: 13,
    },
    notice: {
        backgroundColor: '#fef3c7',
        color: '#78350f',
        padding: 16,
        borderRadius: 8,
        fontSize: 14,
        lineHeight: 1.5,
    },
    footer: {
        padding: 24,
        borderTop: '1px solid #374151',
        display: 'flex',
        justifyContent: 'center',
    },
    closeButton: {
        backgroundColor: '#f8b749',
        color: '#1f2937',
        border: 'none',
        padding: '12px 32px',
        borderRadius: 8,
        fontSize: 16,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
};

export default RentSuccessModal;
