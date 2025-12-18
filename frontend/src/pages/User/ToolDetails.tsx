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
    readonly id?: string | number;
    readonly startDate: string; // yyyy-MM-dd
    readonly endDate: string;   // yyyy-MM-dd
    readonly status: BlockedDateStatus;
}

const BLOCKING_STATUSES = new Set<BlockedDateStatus>(["APPROVED", "ACTIVE"]);
const LOCAL_BLOCKED_KEY = "local_blocked_ranges_v3";

// ---------- helpers ----------
function apiUrl(path: string): string {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    const apiPrefix = normalized.startsWith("/api") ? "" : "/api";
    return `${apiPrefix}${normalized}`;
}

function getJwt(): string | null {
    return localStorage.getItem("jwt");
}

function toIsoDateString(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function daysBetween(startStr: string, endStr: string, inclusive: boolean): number {
    if (!startStr || !endStr) return 0;
    const s = new Date(startStr);
    const e = new Date(endStr);
    const utcStart = Date.UTC(s.getFullYear(), s.getMonth(), s.getDate());
    const utcEnd = Date.UTC(e.getFullYear(), e.getMonth(), e.getDate());
    let diff = Math.floor((utcEnd - utcStart) / (24 * 60 * 60 * 1000));
    if (inclusive) diff += 1;
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

function safeWarn(...args: unknown[]): void {
    // eslint-disable-next-line no-console
    console.warn(...args);
}

function safeError(...args: unknown[]): void {
    // eslint-disable-next-line no-console
    console.error(...args);
}

function safeLog(...args: unknown[]): void {
    // eslint-disable-next-line no-console
    console.log(...args);
}

// ---------- localStorage ----------
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

function saveLocalBlockedRange(toolId: string, range: BlockedDateRange): void {
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

// ---------- estados ----------
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

// ---------- ranges ----------
function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
    try {
        const Astart = new Date(aStart);
        const Aend = new Date(aEnd);
        const Bstart = new Date(bStart);
        const Bend = new Date(bEnd);
        const utc = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
        return Math.max(utc(Astart), utc(Bstart)) <= Math.min(utc(Aend), utc(Bend));
    } catch {
        return false;
    }
}

function isRangeBlocked(
    start: string,
    end: string,
    blocked: readonly BlockedDateRange[]
): boolean {
    if (!start || !end) return false;
    return blocked.some(
        (b) => BLOCKING_STATUSES.has(b.status) && rangesOverlap(start, end, b.startDate, b.endDate)
    );
}

function validateRange(
    start: string,
    end: string,
    days: number,
    minStart: string
): string | null {
    if (!start || !end || days <= 0) return null;
    if (start < minStart) {
        return "A data de início não pode ser hoje. Selecione uma data a partir de amanhã.";
    }
    return null;
}

// ---------- MiniCalendar ----------
type MiniCalendarProps = {
    readonly today: Date;
    readonly minStart: string;
    readonly start: string;
    readonly end: string;
    readonly success: string | null;
    readonly blockedDates: readonly BlockedDateRange[];
    readonly onChangeRange: (start: string, end: string) => void;
};

const MiniCalendar: React.FC<MiniCalendarProps> = ({
                                                       today,
                                                       minStart,
                                                       start,
                                                       end,
                                                       success,
                                                       blockedDates,
                                                       onChangeRange,
                                                   }) => {
    // Track which month is being viewed
    const [viewMonth, setViewMonth] = useState<Date>(() => {
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        return new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1);
    });
    
    // Track selection mode: 'start' or 'end'
    const [selectionMode, setSelectionMode] = useState<'start' | 'end'>('end');

    // Generate dates for the current view month
    const calendarDays = useMemo(() => {
        const year = viewMonth.getFullYear();
        const month = viewMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const arr: { iso: string; label: string; dateObj: Date; isCurrentMonth: boolean }[] = [];
        
        // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
        // Adjust to start from Monday (1 = Monday, 0 = Sunday becomes 7)
        let startDayOfWeek = firstDay.getDay();
        if (startDayOfWeek === 0) startDayOfWeek = 7;
        startDayOfWeek -= 1; // Make Monday = 0
        
        // Add days from previous month to fill the first week
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const d = new Date(year, month, -i);
            arr.push({ 
                iso: toIsoDateString(d), 
                label: d.getDate().toString(), 
                dateObj: d,
                isCurrentMonth: false
            });
        }
        
        // Add all days of the current month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const d = new Date(year, month, day);
            arr.push({ 
                iso: toIsoDateString(d), 
                label: d.getDate().toString(), 
                dateObj: d,
                isCurrentMonth: true
            });
        }
        
        // Add days from next month to complete the grid (6 rows x 7 days = 42 cells)
        const remaining = 42 - arr.length;
        for (let i = 1; i <= remaining; i++) {
            const d = new Date(year, month + 1, i);
            arr.push({ 
                iso: toIsoDateString(d), 
                label: d.getDate().toString(), 
                dateObj: d,
                isCurrentMonth: false
            });
        }
        
        return arr;
    }, [viewMonth]);

    const isBlockedDay = (iso: string): boolean =>
        blockedDates.some(
            (b) =>
                BLOCKING_STATUSES.has(b.status) &&
                rangesOverlap(iso, iso, b.startDate, b.endDate)
        );

    const isInRange = (iso: string): boolean => {
        return iso >= start && iso <= end;
    };

    const goToPreviousMonth = () => {
        setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const monthName = viewMonth.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });

    // Check if previous month button should be disabled
    const canGoPrevious = useMemo(() => {
        const lastDayOfPrevMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 0);
        return toIsoDateString(lastDayOfPrevMonth) >= minStart;
    }, [viewMonth, minStart]);

    const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

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
            
            {/* Selection mode toggle */}
            <div style={{ 
                display: 'flex', 
                gap: 8, 
                marginBottom: 12,
                alignItems: 'center'
            }}>
                <span style={{ color: '#fff', fontSize: 13 }}>Selecionar:</span>
                <button
                    type="button"
                    onClick={() => setSelectionMode('start')}
                    disabled={!!success}
                    style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: 'none',
                        cursor: success ? 'not-allowed' : 'pointer',
                        background: selectionMode === 'start' ? '#10b981' : 'rgba(255,255,255,0.1)',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: selectionMode === 'start' ? 600 : 400,
                    }}
                >
                    📅 Data Início
                </button>
                <button
                    type="button"
                    onClick={() => setSelectionMode('end')}
                    disabled={!!success}
                    style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: 'none',
                        cursor: success ? 'not-allowed' : 'pointer',
                        background: selectionMode === 'end' ? '#10b981' : 'rgba(255,255,255,0.1)',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: selectionMode === 'end' ? 600 : 400,
                    }}
                >
                    📅 Data Fim
                </button>
            </div>

            {/* Month navigation */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
                padding: '8px 4px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 6,
            }}>
                <button
                    type="button"
                    onClick={goToPreviousMonth}
                    disabled={!canGoPrevious || !!success}
                    aria-label="Mês anterior"
                    style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: 'none',
                        cursor: (!canGoPrevious || success) ? 'not-allowed' : 'pointer',
                        background: canGoPrevious && !success ? 'rgba(255,255,255,0.1)' : 'transparent',
                        color: canGoPrevious && !success ? '#fff' : 'rgba(255,255,255,0.3)',
                        fontSize: 14,
                        fontWeight: 600,
                    }}
                >
                    ◀ Anterior
                </button>
                <span style={{ 
                    color: '#fff', 
                    fontWeight: 600, 
                    fontSize: 15,
                    textTransform: 'capitalize'
                }}>
                    {monthName}
                </span>
                <button
                    type="button"
                    onClick={goToNextMonth}
                    disabled={!!success}
                    aria-label="Próximo mês"
                    style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: 'none',
                        cursor: success ? 'not-allowed' : 'pointer',
                        background: success ? 'transparent' : 'rgba(255,255,255,0.1)',
                        color: success ? 'rgba(255,255,255,0.3)' : '#fff',
                        fontSize: 14,
                        fontWeight: 600,
                    }}
                >
                    Próximo ▶
                </button>
            </div>

            {/* Week day headers */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: 4,
                    marginBottom: 4,
                }}
            >
                {weekDays.map(day => (
                    <div 
                        key={day}
                        style={{
                            textAlign: 'center',
                            color: 'rgba(255,255,255,0.6)',
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '4px 0',
                        }}
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gap: 4,
                }}
            >
                {calendarDays.map((d) => {
                    const blocked = isBlockedDay(d.iso);
                    const isStart = d.iso === start;
                    const isEnd = d.iso === end;
                    const inRange = isInRange(d.iso);
                    const disabled = blocked || !!success || d.iso < minStart;

                    let background = d.isCurrentMonth 
                        ? "rgba(255,255,255,0.03)" 
                        : "rgba(255,255,255,0.01)";
                    let border = "1px solid rgba(255,255,255,0.06)";
                    let color = d.isCurrentMonth ? "#e6eef8" : "rgba(255,255,255,0.3)";

                    if (blocked) {
                        background = "#7f1d1d";
                        color = "#fff";
                    } else if (isStart || isEnd) {
                        background = "#064e3b";
                        border = "2px solid #10b981";
                        color = "#fff";
                    } else if (inRange && d.isCurrentMonth) {
                        background = "rgba(16, 185, 129, 0.2)";
                        border = "1px solid rgba(16, 185, 129, 0.4)";
                    }

                    const handleClick = (): void => {
                        if (success || disabled) return;
                        
                        if (selectionMode === 'start') {
                            // Setting new start date
                            let newStart = d.iso;
                            let newEnd = end;
                            
                            // Ensure end is after start
                            if (newEnd <= newStart) {
                                newEnd = toIsoDateString(
                                    new Date(new Date(newStart).getTime() + 24 * 60 * 60 * 1000)
                                );
                            }
                            
                            // Check for blocking
                            if (!isRangeBlocked(newStart, newEnd, blockedDates)) {
                                onChangeRange(newStart, newEnd);
                            }
                        } else {
                            // Setting new end date
                            if (d.iso <= start) return; // End must be after start
                            
                            if (!isRangeBlocked(start, d.iso, blockedDates)) {
                                onChangeRange(start, d.iso);
                            }
                        }
                    };

                    return (
                        <button
                            key={d.iso}
                            type="button"
                            disabled={disabled}
                            onClick={handleClick}
                            title={
                                blocked
                                    ? "Dia indisponível"
                                    : d.dateObj.toLocaleDateString("pt-PT")
                            }
                            style={{
                                padding: "6px 4px",
                                textAlign: "center",
                                borderRadius: 6,
                                cursor: disabled ? "not-allowed" : "pointer",
                                userSelect: "none",
                                fontSize: 12,
                                border,
                                background,
                                color,
                                opacity: (disabled && !blocked) || !d.isCurrentMonth ? 0.5 : 1,
                                minHeight: 36,
                            }}
                        >
                            <div style={{ fontWeight: isStart || isEnd ? 700 : 500 }}>
                                {d.label}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ---------- BookingCalendar ----------
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

    const handleRangeChange = (newStart: string, newEnd: string): void => {
        setStart(newStart);
        setEnd(newEnd);
    };

    // fetch bloqueios
    useEffect(() => {
        let cancelled = false;

        const fetchBlockedDates = async () => {
            try {
                const res = await fetch(apiUrl(`/tools/${toolId}/blocked-dates`));
                let normalized: BlockedDateRange[] = [];

                if (res.ok) {
                    const raw = await res.json().catch(() => []);
                    if (Array.isArray(raw)) {
                        normalized = raw
                            .map((r: unknown) => {
                                const rec = asRecord(r) ?? {};
                                const status = normalizeBlockedStatus(
                                    safeString(rec["status"])
                                );
                                if (!BLOCKING_STATUSES.has(status)) {
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
                            .filter(
                                (x): x is BlockedDateRange => x !== null
                            );
                    }
                }

                const localMap = loadLocalBlockedRanges();
                const localForTool = (localMap[toolId] ?? []).filter((r) =>
                    BLOCKING_STATUSES.has(r.status)
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
                        (r) => BLOCKING_STATUSES.has(r.status)
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

    // disponibilidade
    useEffect(() => {
        let cancelled = false;

        const checkAvailability = async () => {
            const message = validateRange(start, end, days, minStart);
            if (message) {
                setIsAvailable(false);
                setAvailabilityMessage(message);
                return;
            }

            if (isRangeBlocked(start, end, blockedDates)) {
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
                if (jwt) headers.Authorization = `Bearer ${jwt}`;

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

    const handlePaymentSuccess = (data: RentCreatedData): void => {
        safeLog("✅ Payment and rent creation successful:", data);
        setRentData(data);
        setShowModal(true);
        setSuccess("Pagamento processado com sucesso!");

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

    const handleCloseModal = (): void => {
        setShowModal(false);
        navigate("/user");
    };

    const handlePaymentError = (errorMsg: string): void => {
        safeError("❌ Payment error:", errorMsg);
        setError(errorMsg);
    };

    const handlePaymentCancel = (): void => {
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
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0, 0, 0, 0.75)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                }}
            >
                <div
                    style={{
                        background: "rgba(34, 197, 94, 0.15)",
                        border: "2px solid #22c55e",
                        color: "#86efac",
                        padding: "40px 48px",
                        borderRadius: 16,
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        maxWidth: 420,
                        backdropFilter: "blur(8px)",
                    }}
                >
                    <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                    <p style={{ fontWeight: 700, fontSize: 20, margin: 0 }}>
                        Reserva criada com sucesso!
                    </p>
                    <p style={{ fontSize: 15, marginTop: 12, opacity: 0.9 }}>
                        A redirecionar para a sua página de reservas...
                    </p>
                </div>
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
                        padding: "20px 24px",
                        borderRadius: 8,
                        marginBottom: 12,
                        fontSize: 16,
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                    <div style={{ fontWeight: 600 }}>✅ {success}</div>
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
                            if (
                                newEnd <= newStart ||
                                isRangeBlocked(newStart, newEnd, blockedDates)
                            ) {
                                newEnd = minEndForClamped;
                            }
                            handleRangeChange(newStart, newEnd);
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
                            if (isRangeBlocked(start, candidate, blockedDates)) {
                                return;
                            }
                            handleRangeChange(start, candidate);
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

            <MiniCalendar
                today={today}
                minStart={minStart}
                start={start}
                end={end}
                success={success}
                blockedDates={blockedDates}
                onChangeRange={handleRangeChange}
            />

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

            <div style={{ 
                marginTop: 16,
                display: "flex",
                justifyContent: "center",
            }}>
                {paymentSection}
            </div>

            {showModal && (
                <RentSuccessModal rentData={rentData} onClose={handleCloseModal} />
            )}
        </div>
    );
}

// ---------- ToolDetails ----------
const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundImage: `url(${bgImg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "#fff",
    fontFamily: "Inter, Arial, sans-serif",
    padding: 20,
    overflowY: "auto",
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

        async function load(): Promise<void> {
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
                    if (!listResp.ok) {
                        throw new Error("Erro ao obter ferramentas");
                    }
                    const list = await listResp.json().catch(() => []);
                    if (Array.isArray(list)) {
                        const found = list.find((t: unknown) => {
                            const r = asRecord(t);
                            return r
                                ? safeString(r["id"] ?? r["ID"] ?? "") === String(id)
                                : false;
                        });
                        data = found ?? null;
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
            <div style={containerStyle}>
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
