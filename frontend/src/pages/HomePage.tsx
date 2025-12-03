import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Header from '../components/Header';
import LoadingScreen from '../components/LoadingScreen';

import bgImg from '../assets/rust.jpg';

type Tool = {
    id: string;
    name: string;
    category: string;
    pricePerDay: number;
    oldPricePerDay?: number;
    image?: string;
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
        backgroundRepeat: "no-repeat",
        color: "#fff"
    },
    overlay: {
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.45)"
    },
    content: {
        position: "relative",
        zIndex: 2,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        flex: 1,
    },
    container: {
        fontFamily: "Inter, Arial, sans-serif",
        color: "#fff",
        padding: "0 16px",
        maxWidth: 1100,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        boxSizing: "border-box"
    },
    hero: {
        display: "flex",
        gap: 24,
        alignItems: "center",
        padding: "24px 0"
    },
    heroText: { flex: 1 },
    heroTitle: {
        fontSize: 32,
        margin: "0 0 8px",
        color: "#fff"
    },
    heroDesc: {
        margin: "0 0 16px",
        color: "rgba(255,255,255,0.9)"
    },
    carouselWrapper: {
        position: "relative",
        marginTop: 8
    },
    carouselViewport: {
        display: "flex",
        gap: 16,
        overflowX: "auto",
        scrollBehavior: "smooth",
        paddingBottom: 8,
        paddingTop: 8
    },
    card: {
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        padding: 12,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        color: "#fff",
        minWidth: 260,
        boxSizing: "border-box"
    },
    cardImage: {
        height: 140,
        background: "rgba(255,255,255,0.03)",
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#ddd",
        overflow: "hidden"
    },
    arrowButton: {
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        background: "#f8b749",
        border: "none",
        padding: "8px 10px",
        borderRadius: 6,
        cursor: "pointer",
        zIndex: 3
    },
    arrowLeft: { left: 8 },
    arrowRight: { right: 8 },
    footer: {
        width: "100%",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "18px 0",
        color: "rgba(255,255,255,0.9)",
        textAlign: "center",
        fontSize: 14,
        boxSizing: "border-box",
        background: "transparent"
    },
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
        transform: "scale(0.45)",
        width: 340,
        height: 340
    }
};

export default function HomePage(): React.ReactElement {
    const carouselRef = useRef<HTMLDivElement | null>(null);
    const [tools, setTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const placeholderFor = (type: string, name?: string) =>
        `https://placehold.co/600x400?text=${encodeURIComponent((name || type).slice(0, 30))}`;

    const mapApiToUi = (apiTool: any): Tool => ({
        id: String(apiTool.id),
        name: apiTool.name,
        category: apiTool.type || apiTool.category || "Outros",
        pricePerDay: Number(apiTool.dailyPrice ?? apiTool.pricePerDay ?? 0),
        oldPricePerDay: apiTool.oldPricePerDay ? Number(apiTool.oldPricePerDay) : undefined,
        image: apiTool.imageUrl || apiTool.image || placeholderFor(apiTool.type, apiTool.name),
        promo: Boolean(apiTool.promo) || false
    });

    async function fetchImageFor(name: string) {
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
                if (res.ok) {
                    const data = await res.json();
                    if (data.thumbnail?.source) return data.thumbnail.source;
                }
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
                    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}?width=600`;
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
                    if (hasRealImage) return t;

                    const imageUrl = await fetchImageFor(t.name);
                    if (imageUrl) return { ...t, image: imageUrl };

                    return t;
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

    const scroll = (dir: "left" | "right") => {
        const el = carouselRef.current;
        if (!el) return;
        const amount = Math.floor(el.clientWidth * 0.8);
        el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
    };

    // Filtro de pesquisa
    const filteredTools = searchQuery.trim()
        ? tools.filter(t =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : tools.slice(0, 10); //mostrar 10 produtos

    const isSearching = searchQuery.trim().length > 0;

    return (
        <div style={styles.root}>
            <div style={styles.overlay} />
            <div style={styles.content}>
                <Header />

                <div style={styles.container}>
                    <main>
                        <section style={styles.hero}>
                            <div style={styles.heroText}>
                                <h1 style={styles.heroTitle}>Alugue ferramentas de qualidade, por dias.</h1>
                                <p style={styles.heroDesc}>Encontre ferramentas para obra, jardinagem ou eventos — entrega rápida e preços competitivos.</p>

                                <div style={styles.search}>
                                    <input
                                        style={styles.input}
                                        placeholder="O que pretende alugar?"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </section>

                        <section>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <h2 style={{ color: "#fff", margin: 0 }}>
                                    {isSearching ? "Resultados da pesquisa" : "Ferramentas em destaque"}
                                </h2>
                                {isSearching && (
                                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
                                        {filteredTools.length} resultado{filteredTools.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>

                            {loading ? (
                                <div style={styles.loadingOverlay}>
                                    <div style={styles.loadingInner}>
                                        <LoadingScreen />
                                    </div>
                                </div>
                            ) : null}

                            {isSearching ? (
                                // Modo grid quando pesquisar
                                <div style={{
                                    display: "grid",
                                    gap: 16,
                                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                    marginTop: 12
                                }}>
                                    {filteredTools.length > 0 ? filteredTools.map((tool) => (
                                        <article key={tool.id} style={{
                                            background: "rgba(0,0,0,0.45)",
                                            border: "1px solid rgba(255,255,255,0.06)",
                                            padding: 12,
                                            borderRadius: 10,
                                            display: "flex",
                                            flexDirection: "column",
                                            minHeight: 180
                                        }}>
                                            <div style={{
                                                height: 120,
                                                borderRadius: 8,
                                                background: "rgba(255,255,255,0.03)",
                                                marginBottom: 8,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#ddd",
                                                overflow: "hidden"
                                            }}>
                                                {tool.image ? (
                                                    <img
                                                        src={tool.image}
                                                        alt={tool.name}
                                                        style={{
                                                            width: "100%",
                                                            height: "100%",
                                                            objectFit: "cover",
                                                            borderRadius: 8
                                                        }}
                                                    />
                                                ) : (
                                                    <div>{tool.category}</div>
                                                )}
                                            </div>

                                            <div style={{ fontWeight: 700, marginBottom: 8 }}>{tool.name}</div>

                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                                                <div>
                                                    {tool.oldPricePerDay ? (
                                                        <span style={{
                                                            textDecoration: "line-through",
                                                            color: "rgba(255,255,255,0.6)",
                                                            fontSize: 12,
                                                            marginRight: 8
                                                        }}>
                                                            €{tool.oldPricePerDay}
                                                        </span>
                                                    ) : null}
                                                    <span style={{ fontWeight: 800, fontSize: 16 }}>€{tool.pricePerDay}/dia</span>
                                                </div>

                                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                    {tool.promo ? (
                                                        <div style={{
                                                            background: "#f8b749",
                                                            color: "#111",
                                                            padding: "4px 8px",
                                                            borderRadius: 6,
                                                            fontWeight: 700,
                                                            fontSize: 12
                                                        }}>
                                                            Promo
                                                        </div>
                                                    ) : null}
                                                    <Link
                                                        to={`/tools/${tool.id}`}
                                                        style={{
                                                            color: "#f8b749",
                                                            textDecoration: "none",
                                                            fontWeight: 700
                                                        }}
                                                    >
                                                        Ver
                                                    </Link>
                                                </div>
                                            </div>
                                        </article>
                                    )) : (
                                        <div style={{
                                            gridColumn: "1 / -1",
                                            textAlign: "center",
                                            padding: "40px 20px",
                                            color: "rgba(255,255,255,0.7)"
                                        }}>
                                            Nenhuma ferramenta encontrada para "{searchQuery}"
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Modo carousel quando não pesquisar (mostra 5)
                                <div style={styles.carouselWrapper}>
                                    <button
                                        aria-label="Ver anteriores"
                                        onClick={() => scroll("left")}
                                        style={{ ...styles.arrowButton, ...styles.arrowLeft }}
                                    >
                                        ‹
                                    </button>

                                    <div ref={carouselRef} style={styles.carouselViewport}>
                                        {filteredTools.map((tool) => (
                                            <article key={tool.id} style={styles.card}>
                                                <div style={styles.cardImage}>
                                                    {tool.image ? (
                                                        <img
                                                            src={tool.image}
                                                            alt={tool.name}
                                                            style={{
                                                                width: "100%",
                                                                height: "100%",
                                                                objectFit: "cover",
                                                                borderRadius: 6
                                                            }}
                                                        />
                                                    ) : (
                                                        <div>{tool.category}</div>
                                                    )}
                                                </div>
                                                <div style={{ fontWeight: 600 }}>{tool.name}</div>
                                                <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <div>
                                                        {tool.oldPricePerDay ? (
                                                            <span style={{
                                                                textDecoration: "line-through",
                                                                color: "rgba(255,255,255,0.6)",
                                                                fontSize: 12,
                                                                marginRight: 8
                                                            }}>
                                                                €{tool.oldPricePerDay}
                                                            </span>
                                                        ) : null}
                                                        <span style={{ fontWeight: 700 }}>€{tool.pricePerDay}/dia</span>
                                                    </div>
                                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                        {tool.promo ? (
                                                            <div style={{
                                                                background: "#f8b749",
                                                                color: "#111",
                                                                padding: "4px 8px",
                                                                borderRadius: 6,
                                                                fontWeight: 700,
                                                                fontSize: 12
                                                            }}>
                                                                Promo
                                                            </div>
                                                        ) : null}
                                                        <Link
                                                            to={`/tools/${tool.id}`}
                                                            style={{
                                                                textDecoration: "none",
                                                                color: "#f8b749",
                                                                fontWeight: 600
                                                            }}
                                                        >
                                                            Ver
                                                        </Link>
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>

                                    <button
                                        aria-label="Ver seguintes"
                                        onClick={() => scroll("right")}
                                        style={{ ...styles.arrowButton, ...styles.arrowRight }}
                                    >
                                        ›
                                    </button>
                                </div>
                            )}
                        </section>

                    </main>
                </div>

                <footer style={styles.footer}>
                    © {new Date().getFullYear()} Crafting Stable — Aluguer de ferramentas. Políticas | Contato
                </footer>
            </div>
        </div>
    );
}