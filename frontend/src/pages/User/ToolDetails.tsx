import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import bgImg from "../../assets/rust.jpg";
import Header from "../../components/Header";
import LoadingScreen from "../../components/LoadingScreen";
import PayPalCheckout from "../../components/PayPalCheckout";
import RentSuccessModal from "../../components/RentSuccessModal";
import type { RentCreatedData } from "../../components/PayPalCheckout";

type Tool = {
    id: string;
    name: string;
    category: string;
    pricePerDay: number;
    depositAmount?: number;
    ownerId?: number | null;
    ownerName?: string;
    image?: string;
    description?: string;
    location?: string;
};

type BookingCalendarProps = {
    readonly toolId: string;
    readonly pricePerDay: number;
    readonly inclusive?: boolean;
    readonly currency?: string;
};

const API_PORT = '8081';

function apiUrl(path: string): string {
    const protocol = globalThis.location.protocol;
    const hostname = globalThis.location.hostname;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${protocol}//${hostname}:${API_PORT}${normalized}`;
}

function getJwt(): string | null {
    return localStorage.getItem('jwt');
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
    return Math.max(0, diff);
}

type BlockedDateStatus = 'PENDING' | 'APPROVED' | 'CANCELLED' | 'OTHER';

interface BlockedDateRange {
    startDate: string;
    endDate: string;
    status: BlockedDateStatus;
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
    const [blockedDates, setBlockedDates] = useState<BlockedDateRange[]>([]);

    const days = useMemo(() => daysBetween(start, end, inclusive), [start, end, inclusive]);
    const total = useMemo(() => Number((days * pricePerDay).toFixed(2)), [days, pricePerDay]);

    const fmt = new Intl.NumberFormat("pt-PT", { style: "currency", currency });

    useEffect(() => {
        const fetchBlockedDates = async () => {
            try {
                const response = await fetch(apiUrl(`/api/tools/${toolId}/blocked-dates`));
                if (!response.ok) {
                    setBlockedDates([]);
                    return;
                }

                const raw = await response.json().catch(() => []);
                const allowed = ['PENDING', 'APPROVED', 'CANCELLED'] as const;
                const normalized = Array.isArray(raw)
                    ? raw.map((r: any) => {
                        const s = String(r?.startDate ?? "");
                        const e = String(r?.endDate ?? "");
                        const rs = String(r?.status ?? "").toUpperCase();
                        const status = (allowed as readonly string[]).includes(rs) ? (rs as BlockedDateStatus) : 'OTHER';
                        return { startDate: s, endDate: e, status };
                    })
                    : [];
                setBlockedDates(normalized);
            } catch (err) {
                console.error('Error fetching blocked dates:', err);
                setBlockedDates([]);
            }
        };
        fetchBlockedDates();
    }, [toolId]);

    useEffect(() => {
        const checkAvailability = async () => {
            if (!start || !end || days <= 0) {
                setIsAvailable(false);
                setAvailabilityMessage(null);
                return;
            }

            const jwt = getJwt();

            setCheckingAvailability(true);
            setAvailabilityMessage(null);

            try {
                const startDateTime = `${start}T10:00:00`;
                const endDateTime = `${end}T18:00:00`;

                const headers: HeadersInit = {
                    'Accept': 'application/json'
                };
                if (jwt) {
                    headers['Authorization'] = `Bearer ${jwt}`;
                }

                const response = await fetch(
                    apiUrl(`/api/tools/${toolId}/check-availability?startDate=${encodeURIComponent(startDateTime)}&endDate=${encodeURIComponent(endDateTime)}`),
                    { headers }
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

    const getBackgroundColor = (status: BlockedDateStatus): string => {
        switch (status) {
            case 'PENDING': return '#fef3c7';
            case 'APPROVED': return '#d1fae5';
            case 'CANCELLED': return '#fee2e2';
            default: return '#dbeafe';
        }
    };

    const getTextColor = (status: BlockedDateStatus): string => {
        switch (status) {
            case 'PENDING': return '#92400e';
            case 'APPROVED': return '#065f46';
            case 'CANCELLED': return '#7f1d1d';
            default: return '#1e40af';
        }
    };

    const getStatusIcon = (status: BlockedDateStatus): string => {
        switch (status) {
            case 'PENDING': return '⏳';
            case 'APPROVED': return '✅';
            case 'CANCELLED': return '❌';
            default: return '🚫';
        }
    };

    let paymentSection: React.ReactNode;
    if (!isLoggedIn) {
        paymentSection = (
            <div style={{
                background: "rgba(239, 68, 68, 0.2)",
                border: "1px solid #ef4444",
                color: "#fca5a5",
                padding: "10px 14px",
                borderRadius: 6,
                textAlign: "center"
            }}>
                <p>Por favor <Link to="/loginPage" style={{ color: "#f8b749", textDecoration: "underline" }}>faça login</Link> para reservar esta ferramenta.</p>
            </div>
        );
    } else if (days <= 0) {
        paymentSection = (
            <div style={{
                background: "rgba(251, 191, 36, 0.2)",
                border: "1px solid #fbbf24",
                color: "#fcd34d",
                padding: "10px 14px",
                borderRadius: 6,
                textAlign: "center"
            }}>
                <p>Por favor selecione datas válidas (data de fim após data de início).</p>
            </div>
        );
    } else if (checkingAvailability) {
        paymentSection = (
            <div style={{
                background: "rgba(59, 130, 246, 0.2)",
                border: "1px solid #3b82f6",
                color: "#93c5fd",
                padding: "10px 14px",
                borderRadius: 6,
                textAlign: "center"
            }}>
                <p>🔍 A verificar disponibilidade...</p>
            </div>
        );
    } else if (!isAvailable) {
        paymentSection = (
            <div style={{
                background: "rgba(239, 68, 68, 0.2)",
                border: "1px solid #ef4444",
                color: "#fca5a5",
                padding: "10px 14px",
                borderRadius: 6,
                textAlign: "center"
            }}>
                <p>❌ {availabilityMessage || "Esta ferramenta não está disponível para as datas selecionadas"}</p>
            </div>
        );
    } else if (success) {
        paymentSection = (
            <div style={{
                background: "rgba(34, 197, 94, 0.2)",
                border: "1px solid #22c55e",
                color: "#86efac",
                padding: "10px 14px",
                borderRadius: 6,
                textAlign: "center"
            }}>
                <p>A redirecionar para a sua página de reservas...</p>
            </div>
        );
    } else {
        paymentSection = (
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

    return (
        <div style={{ marginTop: 16, background: "rgba(0,0,0,0.45)", padding: 12, borderRadius: 8 }}>
            {error && (
                <div style={{
                    background: "rgba(239, 68, 68, 0.2)",
                    border: "1px solid #ef4444",
                    color: "#fca5a5",
                    padding: "10px 14px",
                    borderRadius: 6,
                    marginBottom: 12,
                    fontSize: 14
                }}>
                    ⚠️ {error}
                </div>
            )}

            {success && (
                <div style={{
                    background: "rgba(34, 197, 94, 0.2)",
                    border: "1px solid #22c55e",
                    color: "#86efac",
                    padding: "10px 14px",
                    borderRadius: 6,
                    marginBottom: 12,
                    fontSize: 14
                }}>
                    ✅ {success}
                </div>
            )}

            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ color: "#fff", display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Início:</span>
                    <input
                        type="date"
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                        disabled={!!success}
                        aria-label="Data de início"
                    />
                </label>

                <label style={{ color: "#fff", display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Fim:</span>
                    <input
                        type="date"
                        value={end}
                        onChange={(e) => setEnd(e.target.value)}
                        disabled={!!success}
                        aria-label="Data de fim"
                    />
                </label>

                <div style={{ color: "#fff", marginLeft: "auto", textAlign: "right" }}>
                    <div>Dias: <strong>{days}</strong></div>
                    <div>Preço/dia: <strong>{fmt.format(pricePerDay)}</strong></div>
                    <div style={{ fontSize: 18, marginTop: 6 }}>Total: <strong>{fmt.format(total)}</strong></div>
                </div>
            </div>

            {blockedDates.length > 0 && (
                <div style={{
                    marginTop: 12,
                    padding: 10,
                    background: "rgba(251, 191, 36, 0.15)",
                    border: "1px solid #fbbf24",
                    borderRadius: 6
                }}>
                    <div style={{ color: "#fcd34d", fontWeight: 600, marginBottom: 8, fontSize: 13 }}>
                        📅 Datas Indisponíveis:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {blockedDates.map((range) => (
                            <span key={`${range.startDate}-${range.endDate}-${range.status}`} style={{
                                background: getBackgroundColor(range.status),
                                color: getTextColor(range.status),
                                padding: "4px 8px",
                                borderRadius: 4,
                                fontSize: 12,
                                fontWeight: 500
                            }}>
                                {new Date(range.startDate).toLocaleDateString('pt-PT')} - {new Date(range.endDate).toLocaleDateString('pt-PT')}
                                <span style={{ marginLeft: 4, opacity: 0.7 }}>
                                    ({getStatusIcon(range.status)})
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ marginTop: 16 }}>
                {paymentSection}
            </div>

            {showModal && <RentSuccessModal rentData={rentData} onClose={handleCloseModal} />}
        </div>
    );
}

const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundImage: `url(${bgImg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "#fff",
    fontFamily: "Inter, Arial, sans-serif",
    padding: 20
};

export default function ToolDetails(): React.ReactElement {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    useEffect(() => {
        const jwt = localStorage.getItem("jwt");
        if (!jwt) {
            navigate("/loginPage");
        }
    }, [navigate]);

    const [tool, setTool] = useState<Tool | null>(null);
    const [loading, setLoading] = useState(true);

    const placeholderFor = (type: string, name?: string) =>
        `https://placehold.co/800x500?text=${encodeURIComponent((name || type).slice(0, 40))}`;

    useEffect(() => {
        let mounted = true;

        async function fetchOwnerName(ownerId: number | null | undefined) {
            if (!ownerId) return undefined;
            const jwt = getJwt();
            const headers: HeadersInit = {
                'Accept': 'application/json',
                ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {})
            };

            try {
                const res = await fetch(apiUrl(`/api/users/${ownerId}`), { headers });
                if (res.ok) {
                    const u = await res.json().catch(() => null);
                    return u?.username ?? u?.name ?? undefined;
                }
                const listRes = await fetch(apiUrl("/api/users"), { headers });
                if (!listRes.ok) return undefined;
                const list = await listRes.json().catch(() => []);
                const found = Array.isArray(list) ? list.find((x: any) => String(x.id) === String(ownerId)) : null;
                return found ? (found.username ?? found.name) : undefined;
            } catch (e) {
                console.warn("Não foi possível obter ownerName:", e);
                return undefined;
            }
        }

        async function load() {
            setLoading(true);
            const jwt = getJwt();
            const headers: HeadersInit = {
                'Accept': 'application/json',
                ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {})
            };

            try {
                let data: any = null;

                const single = id ? await fetch(apiUrl(`/api/tools/${id}`), { headers }) : null;
                if (single?.ok) {
                    data = await single.json();
                } else {
                    const listResp = await fetch(apiUrl("/api/tools"), { headers });
                    if (!listResp.ok) throw new Error("Erro ao obter ferramentas");
                    const list = await listResp.json();
                    data = Array.isArray(list) ? list.find((t: any) => String(t.id) === String(id)) : null;
                }

                if (!data) {
                    if (mounted) setTool(null);
                    return;
                }

                const mapped: Tool = {
                    id: String(data.id),
                    name: data.name,
                    category: data.type || data.category || "Outros",
                    pricePerDay: Number(data.dailyPrice ?? data.pricePerDay ?? 0),
                    depositAmount: Number(data.depositAmount ?? 0),
                    ownerId: data.ownerId ?? data.owner_id ?? null,
                    image: data.imageUrl || data.image || undefined,
                    description: data.description ?? undefined,
                    location: data.location ?? undefined
                };

                mapped.image = mapped.image ?? placeholderFor(mapped.category, mapped.name);

                if (mounted) {
                    setTool(mapped);
                }
                const ownerName = await fetchOwnerName(mapped.ownerId);
                if (mounted && ownerName) {
                    setTool(prev => prev ? { ...prev, ownerName } : prev);
                }
            } catch (e) {
                console.error(e);
                if (mounted) setTool(null);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        load();
        return () => {
            mounted = false;
        };
    }, [id]);

    if (loading) {
        return (
            <div style={{ ...containerStyle }}>
                <Header />
                <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
                    <div style={{ width: 300, height: 300 }}>
                        <LoadingScreen />
                    </div>
                </div>
            </div>
        );
    }

    if (!tool) {
        return (
            <div style={containerStyle}>
                <Header />
                <div style={{ maxWidth: 900, margin: "40px auto", background: "rgba(0,0,0,0.5)", padding: 20, borderRadius: 8 }}>
                    <div style={{ color: "#fff", marginBottom: 12 }}>Ferramenta não encontrada.</div>
                    <Link to="/catalog" style={{ color: "#f8b749", fontWeight: 700 }}>Voltar ao catálogo</Link>
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <Header />
            <main style={{ maxWidth: 1000, margin: "36px auto", background: "rgba(0,0,0,0.6)", padding: 18, borderRadius: 10 }}>
                <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div style={{ flex: "0 0 420px", borderRadius: 8, overflow: "hidden", background: "rgba(255,255,255,0.02)" }}>
                        <img src={tool.image} alt={tool.name} style={{ width: "100%", display: "block" }} />
                    </div>

                    <div style={{ flex: 1, color: "#fff" }}>
                        <h2 style={{ margin: 0 }}>{tool.name}</h2>

                        <div style={{ marginTop: 8, color: "rgba(255,255,255,0.85)" }}>
                            {tool.description}
                        </div>

                        {tool.location && (
                            <div style={{ marginTop: 8, color: "rgba(255,255,255,0.8)" }}>
                                <strong>Localização:</strong> {tool.location}
                            </div>
                        )}

                        {tool.ownerId && (
                            <div style={{ marginTop: 8, color: "rgba(255,255,255,0.8)" }}>
                                <strong>Vendedor:</strong> {tool.ownerName ?? `Utilizador #${tool.ownerId}`}
                            </div>
                        )}

                        <div style={{ marginTop: 18 }}>
                            <div style={{ fontSize: 22, fontWeight: 800 }}>
                                €{tool.pricePerDay}/dia
                            </div>

                            {tool.depositAmount !== undefined && (
                                <div style={{ fontSize: 16, marginTop: 4, color: "#f8b749" }}>
                                    Caução: <strong>€{tool.depositAmount}</strong>
                                </div>
                            )}
                        </div>

                        <BookingCalendar toolId={tool.id} pricePerDay={tool.pricePerDay} />
                    </div>
                </div>
            </main>
        </div>
    );
}
