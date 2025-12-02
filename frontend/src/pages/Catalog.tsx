import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import bgImg from '../assets/rust.jpg';
import Header from '../components/Header';

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

const sampleTools: Tool[] = [
    { id: "1", name: "Perfuradora Elétrica", category: "Ferramentas Elétricas", pricePerDay: 12, oldPricePerDay: 15, description: "Perfuradora 800W, ideal para obra e bricolage.", promo: true },
    { id: "2", name: "Gerador Portátil", category: "Energia", pricePerDay: 45, oldPricePerDay: 60, description: "Gerador 2kW, silencioso e eficiente.", promo: true },
    { id: "3", name: "Martelo Demolidor", category: "Obras", pricePerDay: 30, description: "Para trabalhos pesados de demolição." },
    { id: "4", name: "Cortador de Relva", category: "Jardinagem", pricePerDay: 18, oldPricePerDay: 22, description: "Corta relva a gasolina, ideal para jardins médios.", promo: true },
    { id: "5", name: "Soprador de Folhas", category: "Jardinagem", pricePerDay: 8, description: "Soprador portátil elétrico, leve e potente." },
    { id: "6", name: "Plaina Elétrica", category: "Carpintaria", pricePerDay: 20, description: "Acabamento de madeira com precisão." },
    { id: "7", name: "Serra Circular", category: "Carpintaria", pricePerDay: 15, description: "Serra para corte de madeira e painéis." },
    { id: "8", name: "Aparador de Sebes", category: "Jardinagem", pricePerDay: 14, description: "Ideal para podar sebes e arbustos." },
    { id: "9", name: "Andaime Modular", category: "Obras", pricePerDay: 60, description: "Andaime leve e modular para trabalhos em altura." },
    { id: "10", name: "Compactadora de Solo", category: "Obras", pricePerDay: 55, description: "Compacta solo para preparação de bases." }
];

const styles: { [k: string]: React.CSSProperties } = {
    root: {
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        backgroundImage: `url(${bgImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "#fff",
        fontFamily: "Inter, Arial, sans-serif"
    },
    overlay: {
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 0,
        pointerEvents: "none"
    },

    /* header / navbar — largura total como HomePage */
    header: {
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        boxSizing: "border-box",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "relative",
        zIndex: 2,
        background: "transparent",
        color: "#fff"
    },
    logo: { display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "inherit" },
    logoImg: { width: 64, height: "auto" },
    logoText: { fontWeight: 700, fontSize: 20, color: "#f8b749" },

    /* container mantém largura centralizada para o conteúdo */
    container: { position: "relative", zIndex: 2, width: "100%", maxWidth: 1200, margin: "0 auto", padding: "0 20px", boxSizing: "border-box" },

    hero: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 18, paddingTop: 12 },
    heroLeft: { flex: 1 },
    heroTitle: { margin: 0, fontSize: 28 },
    heroDesc: { margin: "6px 0 12px", color: "rgba(255,255,255,0.9)" },
    controls: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
    input: { padding: "10px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#fff", minWidth: 220 },
    select: { padding: "10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#fff" },
    chips: { display: "flex", gap: 8, flexWrap: "wrap" },
    chip: { padding: "8px 10px", borderRadius: 999, background: "rgba(255,255,255,0.06)", cursor: "pointer", fontSize: 13 },
    grid: { display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: 12 },
    card: { background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.06)", padding: 12, borderRadius: 10, display: "flex", flexDirection: "column", minHeight: 180 },
    image: { height: 120, borderRadius: 8, background: "rgba(255,255,255,0.03)", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#ddd" },
    priceRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" },
    price: { fontWeight: 800, fontSize: 16 },
    oldPrice: { textDecoration: "line-through", color: "rgba(255,255,255,0.6)", fontSize: 12, marginRight: 8 },
    promoBadge: { background: "#f8b749", color: "#111", padding: "4px 8px", borderRadius: 6, fontWeight: 700, fontSize: 12 },

    /* navbar styles */
    nav: { display: "flex", gap: 12, color: "#fff" },
    navLink: { color: "inherit", textDecoration: "none" },

    /* botão de login */
    loginButton: { padding: "8px 14px", borderRadius: 8, background: "#f8b749", color: "#222", textDecoration: "none", fontWeight: 600 }
};

export default function CatalogPage(): React.ReactElement {
    const [q, setQ] = useState("");
    const [category, setCategory] = useState("all");
    const [sort, setSort] = useState<"relevance" | "price-asc" | "price-desc">("relevance");
    const categories = useMemo(() => ["all", ...Array.from(new Set(sampleTools.map(t => t.category)))], []);

    const filtered = useMemo(() => {
        let list = sampleTools.slice();
        if (q.trim()) {
            const term = q.toLowerCase();
            list = list.filter(t => t.name.toLowerCase().includes(term) || (t.description || "").toLowerCase().includes(term));
        }
        if (category !== "all") list = list.filter(t => t.category === category);
        if (sort === "price-asc") list.sort((a, b) => a.pricePerDay - b.pricePerDay);
        if (sort === "price-desc") list.sort((a, b) => b.pricePerDay - a.pricePerDay);
        return list;
    }, [q, category, sort]);

    return (
        <div style={styles.root}>
            <div style={styles.overlay} />

            <Header />

            <div style={styles.container}>
                <section style={styles.hero}>
                    <div style={styles.heroLeft}>
                        <h1 style={styles.heroTitle}>Promoções e Ofertas</h1>
                        <p style={styles.heroDesc}>Veja as ferramentas em promoção e encontre a opção certa para o seu trabalho — aluguer por dias com descontos exclusivos.</p>

                        <div style={styles.controls}>
                            <input
                                placeholder="Pesquisar ferramentas..."
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                style={styles.input}
                            />

                            <select value={category} onChange={(e) => setCategory(e.target.value)} style={styles.select}>
                                {categories.map(c => <option key={c} value={c}>{c === "all" ? "Todas as categorias" : c}</option>)}
                            </select>

                            <select value={sort} onChange={(e) => setSort(e.target.value as any)} style={styles.select}>
                                <option value="relevance">Relevância</option>
                                <option value="price-asc">Preço ↑</option>
                                <option value="price-desc">Preço ↓</option>
                            </select>
                        </div>

                        <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            <div style={styles.chips}>
                                <div style={styles.chip} onClick={() => setCategory("all")}>Ver tudo</div>
                                <div style={styles.chip} onClick={() => setCategory("Jardinagem")}>Jardinagem</div>
                                <div style={styles.chip} onClick={() => setCategory("Obras")}>Obras</div>
                                <div style={styles.chip} onClick={() => setCategory("Carpintaria")}>Carpintaria</div>
                                <div style={styles.chip} onClick={() => setCategory("Ferramentas Elétricas")}>Elétricas</div>
                            </div>

                            <div style={{ marginLeft: "auto", color: "rgba(255,255,255,0.8)" }}>{filtered.length} resultados</div>
                        </div>
                    </div>
                </section>

                <section>
                    <div style={styles.grid}>
                        {filtered.map(tool => (
                            <article key={tool.id} style={styles.card}>
                                <div style={styles.image}>
                                    {tool.image ? <img src={tool.image} alt={tool.name} style={{ maxHeight: "100%", borderRadius: 8 }} /> : <div>{tool.category}</div>}
                                </div>

                                <div style={{ fontWeight: 700 }}>{tool.name}</div>
                                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 6 }}>{tool.description}</div>

                                <div style={styles.priceRow}>
                                    <div>
                                        {tool.oldPricePerDay ? <span style={styles.oldPrice}>€{tool.oldPricePerDay}</span> : null}
                                        <span style={styles.price}>€{tool.pricePerDay}/dia</span>
                                    </div>

                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        {tool.promo ? <div style={styles.promoBadge}>Promo</div> : null}
                                        <Link to={`/tools/${tool.id}`} style={{ color: "#f8b749", textDecoration: "none", fontWeight: 700 }}>Ver</Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <footer style={{ marginTop: 22, color: "rgba(255,255,255,0.8)", textAlign: "center" }}>
                    © {new Date().getFullYear()} Crafting Stable — Aluguer de ferramentas.
                </footer>
            </div>
        </div>
    );
}
