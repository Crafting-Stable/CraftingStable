import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PayPalCheckout from "../../components/PayPalCheckout";
import RentSuccessModal from "../../components/RentSuccessModal";
import type { RentCreatedData } from "../../components/PayPalCheckout";

type BookingCalendarProps = {
    toolId: string;
    pricePerDay: number;
    inclusive?: boolean;
    currency?: string;
};

function getJwt(): string | null {
    try {
        const ls = (globalThis as any).localStorage;
        return ls?.getItem?.('jwt') ?? null;
    } catch {
        return null;
    }
}

function toIsoDateString(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function daysBetween(startStr: string, endStr: string, inclusive: boolean) {
    if (!startStr || !endStr) return 0;
    const s = new Date(startStr);
    const e = new Date(endStr);
    const utcStart = Date.UTC(s.getFullYear(), s.getMonth(), s.getDate());
    const utcEnd = Date.UTC(e.getFullYear(), e.getMonth(), e.getDate());
    let diff = Math.floor((utcEnd - utcStart) / (24 * 60 * 60 * 1000));
    if (inclusive) diff = diff + 1;
    return diff > 0 ? diff : 0;
}

function apiUrl(path: string): string {
    const loc = (globalThis as any).location;
    const protocol = loc?.protocol ?? "http:";
    const hostname = loc?.hostname ?? "localhost";
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${protocol}//${hostname}:8081${normalized}`;
}

// Extract message box component
function MessageBox({ type, children }: { type: 'error' | 'warning' | 'info' | 'success', children: React.ReactNode }) {
    const styles = {
        error: { background: "rgba(239, 68, 68, 0.2)", border: "1px solid #ef4444", color: "#fca5a5" },
        warning: { background: "rgba(251, 191, 36, 0.2)", border: "1px solid #fbbf24", color: "#fcd34d" },
        info: { background: "rgba(59, 130, 246, 0.2)", border: "1px solid #3b82f6", color: "#93c5fd" },
        success: { background: "rgba(34, 197, 94, 0.2)", border: "1px solid #22c55e", color: "#86efac" }
    };

    return (
        <div style={{ ...styles[type], padding: "10px 14px", borderRadius: 6, textAlign: "center" }}>
            {children}
        </div>
    );
}

// Extract payment section logic
function getPaymentSection(
    isLoggedIn: boolean,
    days: number,
    checkingAvailability: boolean,
    isAvailable: boolean,
    availabilityMessage: string | null,
    success: string | null,
    total: number,
    toolId: string,
    start: string,
    end: string,
    currency: string,
    handlePaymentSuccess: (data: RentCreatedData) => void,
    handlePaymentError: (msg: string) => void,
    handlePaymentCancel: () => void
): React.ReactNode {
    if (!isLoggedIn) {
        return (
            <MessageBox type="error">
                <p>Por favor <Link to="/loginPage" style={{ color: "#f8b749", textDecoration: "underline" }}>faça login</Link> para reservar esta ferramenta.</p>
            </MessageBox>
        );
    }

    if (days <= 0) {
        return (
            <MessageBox type="warning">
                <p>Por favor selecione datas válidas (data de fim após data de início).</p>
            </MessageBox>
        );
    }

    if (checkingAvailability) {
        return (
            <MessageBox type="info">
                <p>🔍 A verificar disponibilidade...</p>
            </MessageBox>
        );
    }

    if (!isAvailable) {
        return (
            <MessageBox type="error">
                <p>❌ {availabilityMessage || "Esta ferramenta não está disponível para as datas selecionadas"}</p>
            </MessageBox>
        );
    }

    if (success) {
        return (
            <MessageBox type="success">
                <p>A redirecionar para a sua página de reservas...</p>
            </MessageBox>
        );
    }

    return (
        <div style={{ maxWidth: 400 }}>
            <p style={{ color: "#ccc", fontSize: 13, marginBottom: 10, textAlign: "center" }}>
                Pague com segurança via PayPal para confirmar a sua reserva
            </p>
            <PayPalCheckout
                toolId={Number(toolId)}
                amount={total.toFixed(2)}
                startDate={start}
                endDate={end}
                currency={currency}
                description={`Reserva de ferramenta #${toolId} - ${days} dia(s)`}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onCancel={handlePaymentCancel}
                disabled={days <= 0}
            />
        </div>
    );
}

function BookingCalendar({
    toolId,
    pricePerDay,
    inclusive = true,
    currency = "EUR"
}: BookingCalendarProps): React.ReactElement {
    const navigate = useNavigate();
    const today = useMemo(() => new Date(), []);
    const [start, setStart] = useState<string>(toIsoDateString(today));
    const [end, setEnd] = useState<string>(toIsoDateString(new Date(today.getTime() + 24 * 60 * 60 * 1000)));
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [rentData, setRentData] = useState<RentCreatedData | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean>(true);
    const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);
    const [checkingAvailability, setCheckingAvailability] = useState(false);

    const days = useMemo(() => daysBetween(start, end, inclusive), [start, end, inclusive]);
    const total = useMemo(() => Number((days * pricePerDay).toFixed(2)), [days, pricePerDay]);

    const fmt = new Intl.NumberFormat("pt-PT", { style: "currency", currency });

    useEffect(() => {
        const checkAvailability = async () => {
            if (!start || !end || days <= 0) {
                setIsAvailable(false);
                setAvailabilityMessage(null);
                return;
            }

            const jwt = getJwt();
            if (!jwt) return;

            setCheckingAvailability(true);
            setAvailabilityMessage(null);

            try {
                const startDateTime = `${start}T10:00:00`;
                const endDateTime = `${end}T18:00:00`;

                const response = await fetch(
                    apiUrl(`/api/tools/${toolId}/check-availability?startDate=${encodeURIComponent(startDateTime)}&endDate=${encodeURIComponent(endDateTime)}`),
                    {
                        headers: {
                            'Authorization': `Bearer ${jwt}`
                        }
                    }
                );

                const data = await response.json().catch(() => ({ available: false }));
                setIsAvailable(Boolean(data.available));
                if (!data.available && data.reason) {
                    setAvailabilityMessage(data.reason);
                } else if (data.available) {
                    setAvailabilityMessage(null);
                }
            } catch (err) {
                console.error('Error checking availability:', err);
                setIsAvailable(false);
                setAvailabilityMessage('Erro ao verificar disponibilidade');
            } finally {
                setCheckingAvailability(false);
            }
        };

        checkAvailability();
    }, [toolId, start, end, days]);

    const handlePaymentSuccess = (data: RentCreatedData) => {
        console.log("✅ Payment and rent creation successful:", data);
        setRentData(data);
        setShowModal(true);
        setSuccess("Pagamento processado com sucesso!");
    };

    const handleCloseModal = () => {
        setShowModal(false);
        navigate('/user');
    };

    const handlePaymentError = (errorMsg: string) => {
        console.error("❌ Payment error:", errorMsg);
        setError(errorMsg);
    };

    const handlePaymentCancel = () => {
        console.log("⚠️ Payment cancelled by user");
        setError("Pagamento cancelado. Pode tentar novamente quando estiver pronto.");
    };

    const jwt = getJwt();
    const isLoggedIn = !!jwt;

    const paymentSection = getPaymentSection(
        isLoggedIn,
        days,
        checkingAvailability,
        isAvailable,
        availabilityMessage,
        success,
        total,
        toolId,
        start,
        end,
        currency,
        handlePaymentSuccess,
        handlePaymentError,
        handlePaymentCancel
    );

    return (
        <div style={{ marginTop: 16, background: "rgba(0,0,0,0.45)", padding: 12, borderRadius: 8 }}>
            {error && (
                <MessageBox type="error">
                    ⚠️ {error}
                </MessageBox>
            )}

            {success && (
                <MessageBox type="success">
                    ✅ {success}
                </MessageBox>
            )}

            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ color: "#fff" }}>
                    Início:
                    <input
                        type="date"
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                        style={{ marginLeft: 8 }}
                        disabled={!!success}
                    />
                </label>

                <label style={{ color: "#fff" }}>
                    Fim:
                    <input
                        type="date"
                        value={end}
                        onChange={(e) => setEnd(e.target.value)}
                        style={{ marginLeft: 8 }}
                        disabled={!!success}
                    />
                </label>

                <div style={{ color: "#fff", marginLeft: "auto", textAlign: "right" }}>
                    <div>Dias: <strong>{days}</strong></div>
                    <div>Preço/dia: <strong>{fmt.format(pricePerDay)}</strong></div>
                    <div style={{ fontSize: 18, marginTop: 6 }}>Total: <strong>{fmt.format(total)}</strong></div>
                </div>
            </div>

            <div style={{ marginTop: 16 }}>
                {paymentSection}
            </div>

            {showModal && <RentSuccessModal rentData={rentData} onClose={handleCloseModal} />}
        </div>
    );
}

export default BookingCalendar;