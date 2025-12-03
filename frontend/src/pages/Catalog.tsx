import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import bgImg from '../assets/rust.jpg';
import Header from '../components/Header';
import LoadingScreen from '../components/LoadingScreen';

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
        fontFamily: "Inter, Arial, sans-serif",
        overflowY: "auto",                // permite scroll vertical
        WebkitOverflowScrolling: "touch"  // suaviza scroll em touch
    },
    overlay: {
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 0,
        pointerEvents: "none"
    },
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
    /* ... demais estilos inalterados ... */
    container: { position: "relative", zIndex: 2, width: "100%", maxWidth: 1200, margin: "0 auto", padding: "0 20px", boxSizing: "border-box" },
    /* ... */
    grid: { display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginTop: 12 },
    /* Loading overlay fix: fixed, centered, but `pointerEvents: none` para não bloquear scroll */
    loadingOverlay: {
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        pointerEvents: "none"
    },
    loadingInner: {
        pointerEvents: "none",
        transform: "scale(0.45)", // reduz o SVG grande sem mexer no componente
        width: 340,
        height: 340
    }
};

export default function CatalogPage(): React.ReactElement {
    const [q, setQ] = useState("");
    const [category, setCategory] = useState("all");
    const [sort, setSort] = useState<"relevance" | "price-asc" | "price-desc">("relevance");
    const [tools, setTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(false);

    const placeholderFor = (type: string, name?: string) =>
        `https://placehold.co/600x400?text=${encodeURIComponent((name || type).slice(0, 30))}`;

    const mapApiToUi = (apiTool: any): Tool => ({
        id: String(apiTool.id),
        name: apiTool.name,
        category: apiTool.type || apiTool.category || "Outros",
        pricePerDay: Number(apiTool.dailyPrice ?? apiTool.pricePerDay ?? 0),
        oldPricePerDay: apiTool.oldPricePerDay ? Number(apiTool.oldPricePerDay) : undefined,
        image: apiTool.imageUrl || apiTool.image || placeholderFor(apiTool.type, apiTool.name),
        description: apiTool.description ?? undefined,
        promo: Boolean(apiTool.promo) || false
    });

    async function fetchWikipediaFor(name: string) {
        const langs = ['en', 'pt'];

        for (const lang of langs) {
            try {
                const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(name)}&srlimit=1&origin=*`;
                const searchResp = await fetch(searchUrl);
                if (!searchResp.ok) continue;
                const searchJson = await searchResp.json();
                const first = searchJson.query && searchJson.query.search && searchJson.query.search[0];
                if (!first) continue;

                const foundTitle = first.title.replace(/ /g, '_');
                const res = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(foundTitle)}`);
                if (res.ok) return await res.json();
            } catch {
                // ignora e tenta próximo idioma
            }
        }

        try {
            const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=pt&type=item&search=${encodeURIComponent(name)}&origin=*`;
            const searchResp = await fetch(searchUrl);
            if (!searchResp.ok) return null;
            const searchJson = await searchResp.json();
            const first = searchJson.search && searchJson.search[0];
            if (!first) return null;
            const id = first.id;

            const getUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&ids=${encodeURIComponent(id)}&props=claims&languages=pt|en&origin=*`;
            const getResp = await fetch(getUrl);
            if (!getResp.ok) return null;
            const getJson = await getResp.json();
            const entity = getJson.entities && getJson.entities[id];
            const claims = entity && entity.claims && entity.claims.P18;
            if (Array.isArray(claims) && claims.length > 0) {
                let fileName = claims[0].mainsnak?.datavalue?.value;
                if (fileName) {
                    fileName = fileName.replace(/^File:/i, '').trim();
                    const encoded = encodeURIComponent(fileName).replace(/\+/g, '%20');
                    const imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}`;
                    return { thumbnail: { source: imageUrl }, extract: first.description || first.label || null };
                }
            }
        } catch {
            // ignora
        }

        return null;
    }

    useEffect(() => {
        let mounted = true;
        async function loadAndEnrich() {
            setLoading(true);
            try {
                const res = await fetch("/api/tools");
                if (!res.ok) throw new Error("Erro ao obter ferramentas");
                const data = await res.json();
                if (!Array.isArray(data)) {
                    if (mounted) setTools([]);
                    return;
                }
                const mapped = data.map(mapApiToUi);
                const enriched = await Promise.all(mapped.map(async (t) => {
                    const hasRealImage = !!t.image && !t.image.includes("placehold.co");
                    if (hasRealImage && t.description) return t;
                    const w = await fetchWikipediaFor(t.name);
                    if (!w) return t;
                    const image = (hasRealImage ? t.image : (w.thumbnail && w.thumbnail.source)) || undefined;
                    const description = t.description || w.extract || undefined;
                    return { ...t, image: image ?? placeholderFor(t.category, t.name), description };
                }));
                if (mounted) setTools(enriched);
            } catch (e) {
                console.error(e);
                if (mounted) setTools([]);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        loadAndEnrich();
        return () => { mounted = false; };
    }, []);

    const categories = useMemo(() => ["all", ...Array.from(new Set(tools.map(t => t.category)))], [tools]);

    const filtered = useMemo(() => {
        let list = tools.slice();
        if (q.trim()) {
            const term = q.toLowerCase();
            list = list.filter(t => t.name.toLowerCase().includes(term) || (t.description || "").toLowerCase().includes(term));
        }
        if (category !== "all") list = list.filter(t => t.category === category);
        if (sort === "price-asc") list.sort((a, b) => a.pricePerDay - b.pricePerDay);
        if (sort === "price-desc") list.sort((a, b) => b.pricePerDay - a.pricePerDay);
        return list;
    }, [tools, q, category, sort]);

    return (
        <div style={styles.root}>
            <div style={styles.overlay} />

            <Header />

            <div style={styles.container}>
                <section style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 18, paddingTop: 12 }}>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: 0, fontSize: 28 }}>Promoções e Ofertas</h1>
                        <p style={{ margin: "6px 0 12px", color: "rgba(255,255,255,0.9)" }}>Veja as ferramentas em promoção e encontre a opção certa para o seu trabalho — aluguer por dias com descontos exclusivos.</p>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                            <input
                                placeholder="Pesquisar ferramentas..."
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                style={{ padding: "10px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#fff", minWidth: 220 }}
                            />

                            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: "10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#fff" }}>
                                {categories.map(c => <option key={c} value={c}>{c === "all" ? "Todas as categorias" : c}</option>)}
                            </select>

                            <select value={sort} onChange={(e) => setSort(e.target.value as any)} style={{ padding: "10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#fff" }}>
                                <option value="relevance">Relevância</option>
                                <option value="price-asc">Preço ↑</option>
                                <option value="price-desc">Preço ↓</option>
                            </select>
                        </div>

                        <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <div style={{ padding: "8px 10px", borderRadius: 999, background: "rgba(255,255,255,0.06)", cursor: "pointer", fontSize: 13 }} onClick={() => setCategory("all")}>Ver tudo</div>
                                <div style={{ padding: "8px 10px", borderRadius: 999, background: "rgba(255,255,255,0.06)", cursor: "pointer", fontSize: 13 }} onClick={() => setCategory("Jardinagem")}>Jardinagem</div>
                                <div style={{ padding: "8px 10px", borderRadius: 999, background: "rgba(255,255,255,0.06)", cursor: "pointer", fontSize: 13 }} onClick={() => setCategory("Obras")}>Obras</div>
                                <div style={{ padding: "8px 10px", borderRadius: 999, background: "rgba(255,255,255,0.06)", cursor: "pointer", fontSize: 13 }} onClick={() => setCategory("Carpintaria")}>Carpintaria</div>
                                <div style={{ padding: "8px 10px", borderRadius: 999, background: "rgba(255,255,255,0.06)", cursor: "pointer", fontSize: 13 }} onClick={() => setCategory("Elétricas")}>Elétricas</div>
                            </div>

                            <div style={{ marginLeft: "auto", color: "rgba(255,255,255,0.8)" }}>{filtered.length} resultados</div>
                        </div>
                    </div>
                </section>

                <section>
                    {/* substituído: overlay de loading que não bloqueia scroll */}
                    {loading ? (
                        <div style={styles.loadingOverlay}>
                            <div style={styles.loadingInner}>
                                <LoadingScreen />
                            </div>
                        </div>
                    ) : null}

                    <div style={styles.grid}>
                        {filtered.map(tool => (
                            <article key={tool.id} style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.06)", padding: 12, borderRadius: 10, display: "flex", flexDirection: "column", minHeight: 180 }}>
                                <div style={{ height: 120, borderRadius: 8, background: "rgba(255,255,255,0.03)", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#ddd" }}>
                                    {tool.image ? <img src={tool.image} alt={tool.name} style={{ maxHeight: "100%", borderRadius: 8 }} /> : <div>{tool.category}</div>}
                                </div>

                                <div style={{ fontWeight: 700 }}>{tool.name}</div>
                                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 6 }}>{tool.description}</div>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                                    <div>
                                        {tool.oldPricePerDay ? <span style={{ textDecoration: "line-through", color: "rgba(255,255,255,0.6)", fontSize: 12, marginRight: 8 }}>€{tool.oldPricePerDay}</span> : null}
                                        <span style={{ fontWeight: 800, fontSize: 16 }}>€{tool.pricePerDay}/dia</span>
                                    </div>

                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        {tool.promo ? <div style={{ background: "#f8b749", color: "#111", padding: "4px 8px", borderRadius: 6, fontWeight: 700, fontSize: 12 }}>Promo</div> : null}
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
