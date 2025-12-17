import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import bgImg from "../../assets/rust.jpg";
import Header from "../../components/Header";
import LoadingScreen from "../../components/LoadingScreen";
import PayPalCheckout, { type RentCreatedData } from "../../components/PayPalCheckout";
import RentSuccessModal from "../../components/RentSuccessModal";

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

type BlockedDateStatus =
    | "PENDING"
    | "APPROVED"
    | "ACTIVE"
    | "REJECTED"
    | "CANCELED"
    | "FINISHED"
    | "OTHER";

interface BlockedDateRange {
    id?: string | number;
    startDate: string; // yyyy-MM-dd
    endDate: string;   // yyyy-MM-dd
    status: BlockedDateStatus;
}

// estados realmente bloqueantes (como no backend: APPROVED + ACTIVE)
const BLOCKING_STATUSES: BlockedDateStatus[] = ["APPROVED", "ACTIVE"];

const LOCAL_BLOCKED_KEY = "local_blocked_ranges_v3";

// ---------------- helpers gerais ----------------
function apiUrl(path: string): string {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    const apiPrefix = normalized.startsWith("/api") ? "" : "/api";
    return `${apiPrefix}${normalized}`;
}

function getJwt(): string | null {
    return localStorage.getItem("jwt");
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

function asRecord(u: unknown): Record<string, unknown> | null {
    return typeof u === "object" && u !== null ? (u as Record<string, unknown>) : null;
}

function safeString(value: unknown): string {
    try {
        if (typeof value === "string") return value;
        if (value === undefined || value === null) return "";
        if (typeof value === "object" || typeof value === "function") {
            try {
                return JSON.stringify(value);
            } catch {
                return Object.prototype.toString.call(value);
            }
        }
        return String(value);
    } catch {
        return "";
    }
}

function safeWarn(...args: unknown[]) {
    // podes trocar por console.warn normal se quiseres
    console.warn(...args);
}
function safeError(...args: unknown[]) {
    console.error(...args);
}
function safeLog(...args: unknown[]) {
    console.log(...args);
}

// ---------------- persistência local defensiva ----------------
function loadLocalBlockedRanges(): Record<string, BlockedDateRange[]> {
    try {
        const raw = localStorage.getItem(LOCAL_BLOCKED_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null) return {};
        return parsed as Record<string, BlockedDateRange[]>;
    } catch {
        return {};
    }
}

function saveLocalBlockedRange(toolId: string, range: BlockedDateRange) {
    try {
        const map = loadLocalBlockedRanges();
        map[toolId] = map[toolId] || [];
        const exists = map[toolId].some(
            (r) =>
                r.startDate === range.startDate &&
                r.endDate === range.endDate &&
                r.status === range.status
        );
        if (!exists) map[toolId].push(range);
        localStorage.setItem(LOCAL_BLOCKED_KEY, JSON.stringify(map));
    } catch (e) {
        safeWarn("Could not save local blocked range:", e);
    }
}

// ---------------- normalização de estados (igual ao backend) ----------------
function normalizeBlockedStatus(raw: string): BlockedDateStatus {
    const s = String(raw || "").trim().toUpperCase();
    if (!s) return "OTHER";
    if (s === "PENDING") return "PENDING";
    if (s === "APPROVED") return "APPROVED";
    if (s === "ACTIVE") return "ACTIVE";
    if (s === "REJECTED") return "REJECTED";
    if (s === "CANCELED" || s === "CANCELLED") return "CANCELED";
    if (s === "FINISHED") return "FINISHED";
    return "OTHER";
}

// ---------------- BookingCalendar ----------------
function BookingCalendar({
                             toolId,
                             pricePerDay,
                             inclusive = true,
                             currency = "EUR",
                         }: BookingCalendarProps): React.ReactElement {
    const navigate = useNavigate();
    const today = useMemo(() => new Date(), []);
    const minStart = useMemo(
        () => toIsoDateString(new Date(today.getTime() + 24 * 60 * 60 * 1000)),
        [today]
    );
    const defaultStart = minStart;
    const defaultEnd = useMemo(
        () =>
            toIsoDateString(
                new Date(new Date(defaultStart).getTime() + 24 * 60 * 60 * 1000)
            ),
        [defaultStart]
    );

    const [start, setStart] = useState<string>(defaultStart);
    const [end, setEnd] = useState<string>(defaultEnd);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [rentData, setRentData] = useState<RentCreatedData | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean>(true);
    const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(
        null
    );
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [blockedDates, setBlockedDates] = useState<BlockedDateRange[]>([]);

    const days = useMemo(() => daysBetween(start, end, inclusive), [start, end, inclusive]);
    const total = useMemo(
        () => Number((days * pricePerDay).toFixed(2)),
        [days, pricePerDay]
    );
    const fmt = new Intl.NumberFormat("pt-PT", { style: "currency", currency });

    const rangesOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) => {
        try {
            const Astart = new Date(aStart);
            const Aend = new Date(aEnd);
            const Bstart = new Date(bStart);
            const Bend = new Date(bEnd);
            const utc = (d: Date) =>
                Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
            return Math.max(utc(Astart), utc(Bstart)) <= Math.min(utc(Aend), utc(Bend));
        } catch {
            return false;
        }
    };

    const isRangeBlocked = (s: string, e: string) => {
        if (!s || !e) return false;
        return blockedDates.some(
            (b) =>
                BLOCKING_STATUSES.includes(b.status) &&
                rangesOverlap(s, e, b.startDate, b.endDate)
        );
    };

    // ---------- MiniCalendar ----------
    function MiniCalendar({ daysToShow = 60 }: { daysToShow?: number }) {
        const startDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const dates: { iso: string; label: string; dateObj: Date }[] = [];

        for (let i = 0; i < daysToShow; i++) {
            const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            dates.push({ iso: toIsoDateString(d), label: d.getDate().toString(), dateObj: d });
        }

        const isBlockedDay = (iso: string) =>
            blockedDates.some(
                (b) =>
                    BLOCKING_STATUSES.includes(b.status) &&
                    rangesOverlap(iso, iso, b.startDate, b.endDate)
            );

        const isSelected = (iso: string) => iso === start || iso === end;

        const handleClick = (iso: string) => {
            if (success) return;
            if (iso < minStart) return;
            if (isBlockedDay(iso)) return; // não deixa clicar num dia bloqueado

            if (iso <= start) {
                const newStart = iso;
                const minEndForClamped = toIsoDateString(
                    new Date(new Date(newStart).getTime() + 24 * 60 * 60 * 1000)
                );
                let newEnd = end;
                if (newEnd <= newStart || isRangeBlocked(newStart, newEnd)) {
                    newEnd = minEndForClamped;
                }
                setStart(newStart);
                setEnd(newEnd);
            } else {
                const minEnd = toIsoDateString(
                    new Date(new Date(start).getTime() + 24 * 60 * 60 * 1000)
                );
                const candidate = iso <= start ? minEnd : iso;
                if (isRangeBlocked(start, candidate)) return;
                setEnd(candidate);
            }
        };

        return (
            <div style={{ marginTop: 12 }}>
                <div
                    style={{
                        color: "#fcd34d",
                        fontWeight: 600,
                        marginBottom: 8,
                        fontSize: 13,
                    }}
                >
                    📆 Calendário (dias alugados em vermelho)
                </div>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, 1fr)",
                        gap: 6,
                    }}
                >
                    {dates.map((d) => {
                        const blocked = isBlockedDay(d.iso);
                        const selected = isSelected(d.iso);
                        const disabled = blocked || !!success || d.iso < minStart;
                        const baseStyle: React.CSSProperties = {
                            padding: "8px 6px",
                            textAlign: "center",
                            borderRadius: 6,
                            cursor: disabled ? "not-allowed" : "pointer",
                            userSelect: "none",
                            fontSize: 13,
                            border: selected
                                ? "2px solid #10b981"
                                : "1px solid rgba(255,255,255,0.06)",
                            background: blocked
                                ? "#7f1d1d"
                                : selected
                                    ? "#064e3b"
                                    : "rgba(255,255,255,0.03)",
                            color: blocked ? "#fff" : selected ? "#fff" : "#e6eef8",
                            opacity: disabled && !blocked ? 0.5 : 1,
                        };
                        return (
                            <div
                                key={d.iso}
                                style={baseStyle}
                                onClick={() => {
                                    if (!disabled) handleClick(d.iso);
                                }}
                                title={
                                    blocked
                                        ? "Dia indisponível"
                                        : d.dateObj.toLocaleDateString("pt-PT")
                                }
                                aria-disabled={disabled}
                            >
                                <div style={{ fontWeight: 700 }}>{d.label}</div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        opacity: 0.8,
                                    }}
                                >
                                    {d.dateObj.toLocaleDateString("pt-PT", {
                                        weekday: "short",
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ---------- fetch dos bloqueios a partir do backend ----------
    useEffect(() => {
        let cancelled = false;

        const fetchBlockedDates = async () => {
            try {
                // Ajusta este path se o teu endpoint for diferente
                const res = await fetch(apiUrl(`/tools/${toolId}/blocked-dates`));
                let normalized: BlockedDateRange[] = [];

                if (res.ok) {
                    const raw = await res.json().catch(() => []);
                    if (Array.isArray(raw)) {
                        normalized = raw
                            .map((r: unknown) => {
                                const rec = asRecord(r) ?? {};
                                const status = normalizeBlockedStatus(safeString(rec["status"]));
                                if (!BLOCKING_STATUSES.includes(status)) {
                                    // não bloqueia se for PENDING, REJECTED, CANCELED, FINISHED, OTHER
                                    return null;
                                }
                                const s = safeString(rec["startDate"]);
                                const e = safeString(rec["endDate"]);
                                if (!s || !e) return null;
                                const id = rec["id"] ?? rec["ID"];
                                return {
                                    id: id as string | number | undefined,
                                    startDate: s.substring(0, 10),
                                    endDate: e.substring(0, 10),
                                    status,
                                } as BlockedDateRange;
                            })
                            .filter(Boolean) as BlockedDateRange[];
                    }
                }

                // Opcional: mesclar com cache local (apenas bloqueantes)
                const localMap = loadLocalBlockedRanges();
                const localForTool = (localMap[toolId] ?? []).filter((r) =>
                    BLOCKING_STATUSES.includes(r.status)
                );

                const merged: BlockedDateRange[] = [...normalized];
                localForTool.forEach((l) => {
                    const exists = merged.some(
                        (m) =>
                            m.startDate === l.startDate &&
                            m.endDate === l.endDate &&
                            m.status === l.status
                    );
                    if (!exists) merged.push(l);
                });

                if (!cancelled) setBlockedDates(merged);
            } catch (err) {
                safeError("Error fetching blocked dates:", err);
                if (!cancelled) {
                    const localOnly = (loadLocalBlockedRanges()[toolId] ?? []).filter(
                        (r) => BLOCKING_STATUSES.includes(r.status)
                    );
                    setBlockedDates(localOnly);
                }
            }
        };

        fetchBlockedDates();
        return () => {
            cancelled = true;
        };
    }, [toolId]);

    // ---------- verificação de disponibilidade ----------
    useEffect(() => {
        let cancelled = false;

        const checkAvailability = async () => {
            if (!start || !end || days <= 0) {
                setIsAvailable(false);
                setAvailabilityMessage(null);
                return;
            }

            if (start < minStart) {
                setIsAvailable(false);
                setAvailabilityMessage(
                    "A data de início não pode ser hoje. Selecione uma data a partir de amanhã."
                );
                return;
            }

            if (isRangeBlocked(start, end)) {
                setIsAvailable(false);
                setAvailabilityMessage(
                    "As datas selecionadas sobrepõem-se a uma reserva já aprovada/ativa."
                );
                return;
            }

            const jwt = getJwt();
            setCheckingAvailability(true);
            setAvailabilityMessage(null);

            try {
                const startDateTime = `${start}T10:00:00`;
                const endDateTime = `${end}T18:00:00`;
                const headers: HeadersInit = { Accept: "application/json" };
                if (jwt) headers["Authorization"] = `Bearer ${jwt}`;

                const response = await fetch(
                    apiUrl(
                        `/tools/${toolId}/check-availability?startDate=${encodeURIComponent(
                            startDateTime
                        )}&endDate=${encodeURIComponent(endDateTime)}`
                    ),
                    { headers }
                );

                const data = await response.json().catch(() => ({ available: false }));
                const serverAvailable = Boolean(
                    (data as Record<string, unknown>)["available"]
                );
                const reasonRaw = (data as Record<string, unknown>)["reason"];
                const reasonStr = safeString(reasonRaw);

                if (cancelled) return;

                if (!serverAvailable) {
                    setIsAvailable(false);
                    setAvailabilityMessage(
                        reasonStr || "Indisponível para as datas selecionadas."
                    );
                } else {
                    setIsAvailable(true);
                    setAvailabilityMessage(null);
                }
            } catch (err) {
                safeError("Error checking availability:", err);
                if (!cancelled) {
                    setIsAvailable(false);
                    setAvailabilityMessage("Erro ao verificar disponibilidade");
                }
            } finally {
                if (!cancelled) setCheckingAvailability(false);
            }
        };

        checkAvailability();
        return () => {
            cancelled = true;
        };
    }, [toolId, start, end, days, minStart, blockedDates]);

    // ---------- handlers de pagamento ----------
    const handlePaymentSuccess = (data: RentCreatedData) => {
        safeLog("✅ Payment and rent creation successful:", data);
        setRentData(data);
        setShowModal(true);
        setSuccess("Pagamento processado com sucesso!");

        // o backend vai começar em PENDING; o bloqueio real só acontece quando o owner aprova.
        // aqui podemos adicionar como PENDING para feedback visual, mas não conta como bloqueio.
        const newRange: BlockedDateRange = {
            id: data.rentId ?? undefined,
            startDate: data.startDate.slice(0, 10),
            endDate: data.endDate.slice(0, 10),
            status: "PENDING",
        };

        saveLocalBlockedRange(toolId, newRange);

        setIsAvailable(false);
        setAvailabilityMessage("Pedido de reserva criado. Aguarda aprovação.");
    };

    const handleCloseModal = () => {
        setShowModal(false);
        navigate("/user");
    };

    const handlePaymentError = (errorMsg: string) => {
        safeError("❌ Payment error:", errorMsg);
        setError(errorMsg);
    };

    const handlePaymentCancel = () => {
        safeLog("⚠️ Payment cancelled by user");
        setError(
            "Pagamento cancelado. Pode tentar novamente quando estiver pronto."
        );
    };

    const jwt = getJwt();
    const isLoggedIn = !!jwt;

    const getBackgroundColor = (status: BlockedDateStatus): string => {
        switch (status) {
            case "PENDING":
                return "#fef3c7";
            case "APPROVED":
            case "ACTIVE":
                return "#fee2e2";
            case "CANCELED":
            case "REJECTED":
            case "FINISHED":
                return "#dbeafe";
            default:
                return "#e5e7eb";
        }
    };

    const getTextColor = (status: BlockedDateStatus): string => {
        switch (status) {
            case "PENDING":
                return "#92400e";
            case "APPROVED":
            case "ACTIVE":
                return "#7f1d1d";
            case "CANCELED":
            case "REJECTED":
            case "FINISHED":
                return "#1e40af";
            default:
                return "#111827";
        }
    };

    const getStatusIcon = (status: BlockedDateStatus): string => {
        switch (status) {
            case "PENDING":
                return "⏳";
            case "APPROVED":
            case "ACTIVE":
                return "🔴";
            case "CANCELED":
            case "REJECTED":
            case "FINISHED":
                return "❌";
            default:
                return "🚫";
        }
    };

    let paymentSection: React.ReactNode;
    if (!isLoggedIn) {
        paymentSection = (
            <div
                style={{
                    background: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid #ef4444",
                    color: "#fca5a5",
                    padding: "10px 14px",
                    borderRadius: 6,
                    textAlign: "center",
                }}
            >
                <p>
                    Por favor{" "}
                    <Link
                        to="/loginPage"
                        style={{
                            color: "#f8b749",
                            textDecoration: "underline",
                        }}
                    >
                        faça login
                    </Link>{" "}
                    para reservar esta ferramenta.
                </p>
            </div>
        );
    } else if (start < minStart) {
        paymentSection = (
            <div
                style={{
                    background: "rgba(251, 191, 36, 0.12)",
                    border: "1px solid #fbbf24",
                    color: "#fcd34d",
                    padding: "10px 14px",
                    borderRadius: 6,
                    textAlign: "center",
                }}
            >
                <p>
                    Não é possível reservar a partir do dia de hoje. Selecione uma data a partir
                    de amanhã.
                </p>
            </div>
        );
    } else if (days <= 0) {
        paymentSection = (
            <div
                style={{
                    background: "rgba(251, 191, 36, 0.12)",
                    border: "1px solid #fbbf24",
                    color: "#fcd34d",
                    padding: "10px 14px",
                    borderRadius: 6,
                    textAlign: "center",
                }}
            >
                <p>Por favor selecione datas válidas (data de fim após data de início).</p>
            </div>
        );
    } else if (checkingAvailability) {
        paymentSection = (
            <div
                style={{
                    background: "rgba(59, 130, 246, 0.12)",
                    border: "1px solid #3b82f6",
                    color: "#93c5fd",
                    padding: "10px 14px",
                    borderRadius: 6,
                    textAlign: "center",
                }}
            >
                <p>🔍 A verificar disponibilidade...</p>
            </div>
        );
    } else if (!isAvailable) {
        paymentSection = (
            <div
                style={{
                    background: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid #ef4444",
                    color: "#fca5a5",
                    padding: "10px 14px",
                    borderRadius: 6,
                    textAlign: "center",
                }}
            >
                <p>
                    ❌{" "}
                    {availabilityMessage ||
                        "Esta ferramenta não está disponível para as datas selecionadas"}
                </p>
            </div>
        );
    } else if (success) {
        paymentSection = (
            <div
                style={{
                    background: "rgba(34, 197, 94, 0.12)",
                    border: "1px solid #22c55e",
                    color: "#86efac",
                    padding: "10px 14px",
                    borderRadius: 6,
                    textAlign: "center",
                }}
            >
                <p>A redirecionar para a sua página de reservas...</p>
            </div>
        );
    } else {
        paymentSection = (
            <div style={{ maxWidth: 400 }}>
                <p
                    style={{
                        color: "#ccc",
                        fontSize: 13,
                        marginBottom: 10,
                        textAlign: "center",
                    }}
                >
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
        <div
            style={{
                marginTop: 16,
                background: "rgba(0,0,0,0.45)",
                padding: 12,
                borderRadius: 8,
            }}
        >
            {error && (
                <div
                    style={{
                        background: "rgba(239, 68, 68, 0.12)",
                        border: "1px solid #ef4444",
                        color: "#fca5a5",
                        padding: "10px 14px",
                        borderRadius: 6,
                        marginBottom: 12,
                        fontSize: 14,
                    }}
                >
                    ⚠️ {error}
                </div>
            )}

            {success && (
                <div
                    style={{
                        background: "rgba(34, 197, 94, 0.12)",
                        border: "1px solid #22c55e",
                        color: "#86efac",
                        padding: "10px 14px",
                        borderRadius: 6,
                        marginBottom: 12,
                        fontSize: 14,
                    }}
                >
                    ✅ {success}
                </div>
            )}

            <div
                style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                <label
                    style={{
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <span>Início:</span>
                    <input
                        type="date"
                        value={start}
                        min={minStart}
                        onChange={(e) => {
                            const value = e.target.value;
                            const clamped = value < minStart ? minStart : value;
                            let newStart = clamped;
                            let newEnd = end;
                            const minEndForClamped = toIsoDateString(
                                new Date(
                                    new Date(newStart).getTime() + 24 * 60 * 60 * 1000
                                )
                            );
                            if (newEnd <= newStart || isRangeBlocked(newStart, newEnd)) {
                                newEnd = minEndForClamped;
                            }
                            setStart(newStart);
                            setEnd(newEnd);
                        }}
                        disabled={!!success}
                        aria-label="Data de início"
                    />
                </label>

                <label
                    style={{
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    <span>Fim:</span>
                    <input
                        type="date"
                        value={end}
                        min={toIsoDateString(
                            new Date(new Date(start).getTime() + 24 * 60 * 60 * 1000)
                        )}
                        onChange={(e) => {
                            const value = e.target.value;
                            const minEnd = toIsoDateString(
                                new Date(
                                    new Date(start).getTime() + 24 * 60 * 60 * 1000
                                )
                            );
                            const candidate = value <= start ? minEnd : value;
                            if (isRangeBlocked(start, candidate)) {
                                return; // não deixar escolher fim que atravesse bloqueios
                            }
                            setEnd(candidate);
                        }}
                        disabled={!!success}
                        aria-label="Data de fim"
                    />
                </label>

                <div
                    style={{
                        color: "#fff",
                        marginLeft: "auto",
                        textAlign: "right",
                    }}
                >
                    <div>
                        Dias: <strong>{days}</strong>
                    </div>
                    <div>
                        Preço/dia: <strong>{fmt.format(pricePerDay)}</strong>
                    </div>
                    <div
                        style={{
                            fontSize: 18,
                            marginTop: 6,
                        }}
                    >
                        Total: <strong>{fmt.format(total)}</strong>
                    </div>
                </div>
            </div>

            <MiniCalendar daysToShow={60} />

            {blockedDates.length > 0 && (
                <div
                    style={{
                        marginTop: 12,
                        padding: 10,
                        background: "rgba(251, 191, 36, 0.08)",
                        border: "1px solid #fbbf24",
                        borderRadius: 6,
                    }}
                >
                    <div
                        style={{
                            color: "#fcd34d",
                            fontWeight: 600,
                            marginBottom: 8,
                            fontSize: 13,
                        }}
                    >
                        📅 Datas Indisponíveis (aprovadas/ativas):
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {blockedDates.map((range) => (
                            <span
                                key={`${range.id ?? ""}-${range.startDate}-${range.endDate}-${range.status}`}
                                style={{
                                    background: getBackgroundColor(range.status),
                                    color: getTextColor(range.status),
                                    padding: "4px 8px",
                                    borderRadius: 4,
                                    fontSize: 12,
                                    fontWeight: 500,
                                }}
                            >
                                {new Date(range.startDate).toLocaleDateString("pt-PT")}{" "}
                                -{" "}
                                {new Date(range.endDate).toLocaleDateString("pt-PT")}
                                <span
                                    style={{
                                        marginLeft: 6,
                                        opacity: 0.85,
                                    }}
                                >
                                    {getStatusIcon(range.status)}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ marginTop: 16 }}>{paymentSection}</div>

            {showModal && (
                <RentSuccessModal rentData={rentData} onClose={handleCloseModal} />
            )}
        </div>
    );
}

// ---------------- ToolDetails ----------------
const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundImage: `url(${bgImg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "#fff",
    fontFamily: "Inter, Arial, sans-serif",
    padding: 20,
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
        `https://placehold.co/800x500?text=${encodeURIComponent(
            (name || type).slice(0, 40)
        )}`;

    useEffect(() => {
        let mounted = true;

        async function fetchOwnerName(
            ownerId: number | null | undefined
        ): Promise<string | undefined> {
            if (ownerId == null) return undefined;
            const jwt = getJwt();
            const headers: HeadersInit = {
                Accept: "application/json",
                ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
            };

            try {
                const res = await fetch(apiUrl(`/users/${ownerId}`), { headers });
                if (res.ok) {
                    const u = await res.json().catch(() => null);
                    const rec = asRecord(u);
                    if (rec) {
                        const uname = rec["username"] ?? rec["name"] ?? "";
                        return uname ? safeString(uname) : undefined;
                    }
                    return undefined;
                }

                const listRes = await fetch(apiUrl("/users"), { headers });
                if (!listRes.ok) return undefined;
                const list = await listRes.json().catch(() => []);
                if (!Array.isArray(list)) return undefined;
                const found = list.find((x: unknown) => {
                    const r = asRecord(x);
                    return r
                        ? safeString(r["id"] ?? r["ID"] ?? "") === String(ownerId)
                        : false;
                });
                const recFound = asRecord(found);
                if (recFound) {
                    const uname2 = recFound["username"] ?? recFound["name"] ?? "";
                    return uname2 ? safeString(uname2) : undefined;
                }
                return undefined;
            } catch (e) {
                safeWarn("Não foi possível obter ownerName:", e);
                return undefined;
            }
        }

        async function load() {
            setLoading(true);
            const jwt = getJwt();
            const headers: HeadersInit = {
                Accept: "application/json",
                ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
            };

            try {
                let data: unknown = null;
                const single = id
                    ? await fetch(apiUrl(`/tools/${id}`), { headers })
                    : null;
                if (single?.ok) {
                    data = await single.json().catch(() => null);
                } else {
                    const listResp = await fetch(apiUrl("/tools"), { headers });
                    if (!listResp.ok)
                        throw new Error("Erro ao obter ferramentas");
                    const list = await listResp.json().catch(() => []);
                    if (Array.isArray(list)) {
                        const found = list.find((t: unknown) => {
                            const r = asRecord(t);
                            return r
                                ? safeString(r["id"] ?? r["ID"] ?? "") === String(id)
                                : false;
                        });
                        data = found ?? null;
                    } else {
                        data = null;
                    }
                }

                if (!data) {
                    if (mounted) setTool(null);
                    return;
                }

                const rec = asRecord(data) ?? {};
                const rawOwner = rec["ownerId"] ?? rec["owner_id"];
                const ownerId =
                    rawOwner !== undefined &&
                    rawOwner !== null &&
                    rawOwner !== ""
                        ? Number(rawOwner)
                        : null;

                const mapped: Tool = {
                    id: safeString(rec["id"] ?? rec["ID"] ?? ""),
                    name: safeString(rec["name"] ?? ""),
                    category: safeString(rec["type"] ?? rec["category"] ?? "Outros"),
                    pricePerDay: Number(
                        rec["dailyPrice"] ?? rec["pricePerDay"] ?? 0
                    ),
                    depositAmount:
                        rec["depositAmount"] != null && rec["depositAmount"] !== ""
                            ? Number(rec["depositAmount"])
                            : undefined,
                    ownerId,
                    image: safeString(rec["imageUrl"] ?? rec["image"] ?? ""),
                    description: rec["description"]
                        ? safeString(rec["description"])
                        : undefined,
                    location: rec["location"]
                        ? safeString(rec["location"])
                        : undefined,
                };

                mapped.image = mapped.image || placeholderFor(mapped.category, mapped.name);

                if (mounted) setTool(mapped);

                const ownerName: string | undefined = await fetchOwnerName(
                    mapped.ownerId
                );
                if (mounted && ownerName) {
                    setTool((prev) => (prev ? { ...prev, ownerName } : prev));
                }
            } catch (e) {
                safeError(e);
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
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        paddingTop: 80,
                    }}
                >
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
                <div
                    style={{
                        maxWidth: 900,
                        margin: "40px auto",
                        background: "rgba(0,0,0,0.5)",
                        padding: 20,
                        borderRadius: 8,
                    }}
                >
                    <div style={{ color: "#fff", marginBottom: 12 }}>
                        Ferramenta não encontrada.
                    </div>
                    <Link
                        to="/catalog"
                        style={{ color: "#f8b749", fontWeight: 700 }}
                    >
                        Voltar ao catálogo
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <Header />
            <main
                style={{
                    maxWidth: 1000,
                    margin: "36px auto",
                    background: "rgba(0,0,0,0.6)",
                    padding: 18,
                    borderRadius: 10,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: 18,
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                    }}
                >
                    <div
                        style={{
                            flex: "0 0 420px",
                            borderRadius: 8,
                            overflow: "hidden",
                            background: "rgba(255,255,255,0.02)",
                        }}
                    >
                        <img
                            src={tool.image}
                            alt={tool.name}
                            style={{ width: "100%", display: "block" }}
                        />
                    </div>

                    <div style={{ flex: 1, color: "#fff" }}>
                        <h2 style={{ margin: 0 }}>{tool.name}</h2>

                        <div
                            style={{
                                marginTop: 8,
                                color: "rgba(255,255,255,0.85)",
                            }}
                        >
                            {tool.description}
                        </div>

                        {tool.location && (
                            <div
                                style={{
                                    marginTop: 8,
                                    color: "rgba(255,255,255,0.8)",
                                }}
                            >
                                <strong>Localização:</strong> {tool.location}
                            </div>
                        )}

                        {tool.ownerId && (
                            <div
                                style={{
                                    marginTop: 8,
                                    color: "rgba(255,255,255,0.8)",
                                }}
                            >
                                <strong>Vendedor:</strong>{" "}
                                {tool.ownerName ?? `Utilizador #${tool.ownerId}`}
                            </div>
                        )}

                        <div style={{ marginTop: 18 }}>
                            <div style={{ fontSize: 22, fontWeight: 800 }}>
                                €{tool.pricePerDay}/dia
                            </div>

                            {tool.depositAmount !== undefined && (
                                <div
                                    style={{
                                        fontSize: 16,
                                        marginTop: 4,
                                        color: "#f8b749",
                                    }}
                                >
                                    Caução: <strong>€{tool.depositAmount}</strong>
                                </div>
                            )}
                        </div>

                        <BookingCalendar
                            toolId={tool.id}
                            pricePerDay={tool.pricePerDay}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
