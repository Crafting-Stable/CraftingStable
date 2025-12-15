import React, { useEffect, useRef } from 'react';
import type { RentCreatedData } from './PayPalCheckout';

interface RentSuccessModalProps {
    rentData: RentCreatedData | null;
    toolName?: string;
    onClose: () => void;
}

const RentSuccessModal: React.FC<RentSuccessModalProps> = ({ rentData, toolName, onClose }) => {
    const overlayButtonRef = useRef<HTMLButtonElement | null>(null);
    const dialogRef = useRef<HTMLDialogElement | null>(null);
    const titleId = 'rent-success-title';

    useEffect(() => {
        overlayButtonRef.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    if (!rentData) return null;

    const isPending = rentData.status === 'PENDING';
    const startDate = new Date(rentData.startDate).toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
    const endDate = new Date(rentData.endDate).toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

    return (
        <div style={styles.overlay}>
            <button
                ref={overlayButtonRef}
                type="button"
                aria-label="Fechar modal de reserva"
                onClick={onClose}
                style={styles.overlayButton}
            />

            <dialog
                ref={dialogRef}
                open
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                style={styles.dialog}
                onClick={(e) => {
                    if (e.target === dialogRef.current) onClose();
                }}
            >
                {/* HEADER (do 1º modal) */}
                <div style={styles.header}>
                    <div
                        style={{
                            ...styles.icon,
                            backgroundColor: isPending ? '#fef3c7' : '#d1fae5',
                            color: isPending ? '#92400e' : '#065f46',
                        }}
                    >
                        {isPending ? '⏳' : '✅'}
                    </div>
                    <h2 id={titleId} style={styles.title}>
                        {isPending ? 'Pagamento Confirmado!' : 'Reserva Confirmada!'}
                    </h2>
                </div>

                <div style={styles.content}>
                    {/* BANNER PENDENTE (do 1º modal) */}
                    {isPending && (
                        <div style={styles.pendingBanner}>
                            <strong>⏳ Aguardando Aprovação do Proprietário</strong>
                            <p>
                                O pagamento foi processado com sucesso. O proprietário
                                da ferramenta precisa aprovar a reserva.
                            </p>
                        </div>
                    )}

                    {/* DETALHES DA RESERVA */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>Detalhes da Reserva</h3>

                        <InfoRow label="ID da Reserva" value={`#${rentData.rentId}`} />
                        {toolName && <InfoRow label="Ferramenta" value={toolName} />}
                        <InfoRow label="Início" value={startDate} />
                        <InfoRow label="Fim" value={endDate} />

                        <InfoRow
                            label="Estado"
                            value={isPending ? '⏳ PENDENTE' : '✅ APROVADO'}
                            badge
                            pending={isPending}
                        />
                    </div>

                    {/* PRÓXIMOS PASSOS (do 1º modal) */}
                    {isPending && (
                        <div style={styles.nextSteps}>
                            <h4>📋 Próximos passos</h4>
                            <ul>
                                <li>O proprietário será notificado</li>
                                <li>Você receberá uma notificação com a decisão</li>
                                <li>Pode acompanhar em “Minhas Reservas”</li>
                                <li>Pode cancelar antes da aprovação</li>
                            </ul>
                        </div>
                    )}

                    {/* INFORMAÇÃO PAYPAL (mantida) */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>Pagamento (PayPal)</h3>
                        <InfoRow label="Valor Pago" value={`${rentData.totalPrice.toFixed(2)} EUR`} />
                        <InfoRow label="ID PayPal" value={rentData.paypalOrderId} mono />
                        <InfoRow label="ID Captura" value={rentData.paypalCaptureId} mono />
                    </div>
                </div>

                <div style={styles.footer}>
                    <button onClick={onClose} style={styles.closeButton}>
                        Ver Minhas Reservas
                    </button>
                </div>
            </dialog>
        </div>
    );
};

const InfoRow = ({ label, value, badge, pending, mono }: any) => (
    <div style={styles.infoRow}>
        <span style={styles.label}>{label}:</span>
        <span
            style={{
                ...styles.value,
                ...(badge
                    ? {
                        backgroundColor: pending ? '#fef3c7' : '#d1fae5',
                        color: pending ? '#92400e' : '#065f46',
                        padding: '4px 12px',
                        borderRadius: 12,
                    }
                    : {}),
                ...(mono ? { fontFamily: 'monospace', fontSize: 12 } : {}),
            }}
        >
            {value}
        </span>
    </div>
);

const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: 20,
    },
    overlayButton: {
        position: 'absolute',
        inset: 0,
        background: 'transparent',
        border: 'none',
    },
    dialog: {
        backgroundColor: '#1f2937',
        borderRadius: 12,
        maxWidth: 600,
        width: '100%',
        border: 'none',
        padding: 0,
        color: '#f3f4f6',
    },
    header: {
        padding: 32,
        textAlign: 'center',
    },
    icon: {
        width: 72,
        height: 72,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 36,
        margin: '0 auto 16px',
    },
    title: {
        margin: 0,
        fontSize: 24,
        fontWeight: 700,
    },
    content: {
        padding: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 600,
        marginBottom: 12,
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 10,
        gap: 16,
    },
    label: {
        color: '#9ca3af',
        fontSize: 14,
    },
    value: {
        fontSize: 14,
        fontWeight: 600,
        textAlign: 'right',
    },
    pendingBanner: {
        backgroundColor: '#fef3c7',
        color: '#78350f',
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
    },
    nextSteps: {
        backgroundColor: '#374151',
        padding: 16,
        borderRadius: 8,
        fontSize: 14,
        marginBottom: 24,
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
    },
};

export default RentSuccessModal;