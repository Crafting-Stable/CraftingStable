import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import bgImg from "../../assets/rust.jpg";
import Header from "../../components/Header";
import LoadingScreen from "../../components/LoadingScreen";

type Tool = {
    id: string;
    name: string;
    category: string;
    pricePerDay: number;
    oldPricePerDay?: number;
    image?: string;
    description?: string;
    promo?: boolean;
};

type BookingCalendarProps = {
    toolId: string;
    pricePerDay: number;
    inclusive?: boolean;
    currency?: string;
};

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

    const days = useMemo(() => daysBetween(start, end, inclusive), [start, end, inclusive]);
    const total = useMemo(() => Number((days * pricePerDay).toFixed(2)), [days, pricePerDay]);

    const fmt = new Intl.NumberFormat("pt-PT", { style: "currency", currency });

    function onConfirm() {
        const qs = new URLSearchParams({
            toolId,
            start,
            end,
            days: String(days),
            total: String(total)
        }).toString();
        navigate(`/confirm?${qs}`);
    }

    return (
        <div style={{ marginTop: 16, background: "rgba(0,0,0,0.45)", padding: 12, borderRadius: 8 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ color: "#fff" }}>
                    Início:
                    <input
                        type="date"
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                        style={{ marginLeft: 8 }}
                    />
                </label>

                <label style={{ color: "#fff" }}>
                    Fim:
                    <input
                        type="date"
                        value={end}
                        onChange={(e) => setEnd(e.target.value)}
                        style={{ marginLeft: 8 }}
                    />
                </label>

                <div style={{ color: "#fff", marginLeft: "auto", textAlign: "right" }}>
                    <div>Dias: <strong>{days}</strong></div>
                    <div>Preço/dia: <strong>{fmt.format(pricePerDay)}</strong></div>
                    <div style={{ fontSize: 18, marginTop: 6 }}>Total: <strong>{fmt.format(total)}</strong></div>
                </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                <button
                    onClick={onConfirm}
                    disabled={days <= 0}
                    style={{
                        background: "#f8b749",
                        color: "#111",
                        padding: "8px 14px",
                        borderRadius: 6,
                        fontWeight: 700,
                        border: "none",
                        cursor: days > 0 ? "pointer" : "not-allowed"
                    }}
                >
                    Confirmar e Pagar
                </button>
            </div>
        </div>
    );
}
/* --- fim BookingCalendar --- */

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

    // Verifica autenticação e redireciona para a página de login se não houver JWT
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
        async function load() {
            setLoading(true);
            try {
                let data: any = null;
                const single = id ? await fetch(`/api/tools/${id}`) : null;
                if (single && single.ok) {
                    data = await single.json();
                } else {
                    const listResp = await fetch("/api/tools");
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
                    oldPricePerDay: data.oldPricePerDay ? Number(data.oldPricePerDay) : undefined,
                    image: data.imageUrl || data.image || undefined,
                    description: data.description ?? undefined,
                    promo: Boolean(data.promo) || false
                };

                // Sem consultas externas (Wikipedia). Usa placeholder quando não houver imagem.
                mapped.image = mapped.image ?? placeholderFor(mapped.category, mapped.name);
                mapped.description = mapped.description ?? undefined;

                if (mounted) setTool(mapped);
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
                        <div style={{ marginTop: 8, color: "rgba(255,255,255,0.85)" }}>{tool.description}</div>

                        <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 12 }}>
                            <div>
                                {tool.oldPricePerDay ? (
                                    <div style={{ color: "rgba(255,255,255,0.7)", textDecoration: "line-through" }}>€{tool.oldPricePerDay}/dia</div>
                                ) : null}
                                <div style={{ fontSize: 22, fontWeight: 800 }}>€{tool.pricePerDay}/dia</div>
                            </div>

                            {tool.promo ? <div style={{ background: "#f8b749", color: "#111", padding: "6px 10px", borderRadius: 6, fontWeight: 700 }}>Promo</div> : null}

                            <div style={{ marginLeft: "auto" }}>
                                <Link to="/catalog" style={{ color: "#f8b749", fontWeight: 700, textDecoration: "none" }}>Voltar</Link>
                            </div>
                        </div>

                        {/* Renderiza o calendário de reserva aqui */}
                        <BookingCalendar toolId={tool.id} pricePerDay={tool.pricePerDay} />
                    </div>
                </div>
            </main>
        </div>
    );
}
