import React, { useRef } from "react";
import { Link } from "react-router-dom";
import Header from '../components/Header';

import bgImg from '../assets/rust.jpg';

type Tool = {
    id: string;
    name: string;
    category: string;
    pricePerDay: number;
    image?: string;
    description?: string;
};

const sampleTools: Tool[] = [
    { id: "1", name: "Perfuradora Elétrica", category: "Ferramentas Elétricas", pricePerDay: 12, description: "Perfuradora 800W, ideal para obra e bricolage." },
    { id: "2", name: "Gerador Portátil", category: "Energia", pricePerDay: 45, description: "Gerador 2kW, silencioso e eficiente." },
    { id: "3", name: "Martelo Demolidor", category: "Obras", pricePerDay: 30, description: "Para trabalhos pesados de demolição." },
    { id: "4", name: "Cortador de Relva", category: "Jardinagem", pricePerDay: 18, description: "Corta relva a gasolina, ideal para jardins médios." },
    { id: "5", name: "Soprador de Folhas", category: "Jardinagem", pricePerDay: 8, description: "Soprador portátil elétrico, leve e potente." },
    { id: "6", name: "Plaina Elétrica", category: "Carpintaria", pricePerDay: 20, description: "Acabamento de madeira com precisão." },
    { id: "7", name: "Serra Circular", category: "Carpintaria", pricePerDay: 15, description: "Serra para corte de madeira e painéis." },
    { id: "8", name: "Aparador de Sebes", category: "Jardinagem", pricePerDay: 14, description: "Ideal para podar sebes e arbustos." },
    { id: "9", name: "Andaime Modular", category: "Obras", pricePerDay: 60, description: "Andaime leve e modular para trabalhos em altura." },
    { id: "10", name: "Compactadora de Solo", category: "Obras", pricePerDay: 55, description: "Compacta solo para preparação de bases." },
    { id: "11", name: "Nível Laser", category: "Medição", pricePerDay: 10, description: "Nível laser para alinhamento e nivelamento precisos." },
    { id: "12", name: "Medidor de Distância (Laser)", category: "Medição", pricePerDay: 9, description: "Mede distâncias até 50m com precisão." },
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
    container: { fontFamily: "Inter, Arial, sans-serif", color: "#fff", padding: "0 16px", maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", flex: 1, boxSizing: "border-box" },
    nav: { display: "flex", gap: 12, color: "#fff", fontFamily: "Inter, Arial, sans-serif" },
    hero: { display: "flex", gap: 24, alignItems: "center", padding: "24px 0" },
    heroText: { flex: 1 },
    heroTitle: { fontSize: 32, margin: "0 0 8px", color: "#fff" },
    heroDesc: { margin: "0 0 16px", color: "rgba(255,255,255,0.9)" },
    search: { display: "flex", gap: 8 },
    input: { padding: "10px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.2)", flex: 1, background: "rgba(255,255,255,0.05)", color: "#fff" },

    /* Carousel styles */
    carouselWrapper: { position: "relative", marginTop: 8 },
    carouselViewport: { display: "flex", gap: 16, overflowX: "auto", scrollBehavior: "smooth", paddingBottom: 8, paddingTop: 8 },
    card: { border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 12, background: "rgba(0,0,0,0.35)", display: "flex", flexDirection: "column", gap: 8, color: "#fff", minWidth: 260, boxSizing: "border-box" },
    cardImage: { height: 140, background: "rgba(255,255,255,0.03)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#ddd" },

    arrowButton: { position: "absolute", top: "50%", transform: "translateY(-50%)", background: "#f8b749", border: "none", padding: "8px 10px", borderRadius: 6, cursor: "pointer", zIndex: 3 },
    arrowLeft: { left: 8 },
    arrowRight: { right: 8 },

    footer: { width: "100%", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "18px 0", color: "rgba(255,255,255,0.9)", textAlign: "center", fontSize: 14, boxSizing: "border-box", background: "transparent" },
};

export default function HomePage(): React.ReactElement {
    const carouselRef = useRef<HTMLDivElement | null>(null);

    const scroll = (dir: "left" | "right") => {
        const el = carouselRef.current;
        if (!el) return;
        const amount = Math.floor(el.clientWidth * 0.8);
        el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
    };

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
                                    <input style={styles.input} placeholder="O que pretende alugar?" />
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 style={{ color: "#fff" }}>Ferramentas em destaque</h2>

                            <div style={styles.carouselWrapper}>
                                <button
                                    aria-label="Ver anteriores"
                                    onClick={() => scroll("left")}
                                    style={{ ...styles.arrowButton, ...styles.arrowLeft }}
                                >
                                    ‹
                                </button>

                                <div ref={carouselRef} style={styles.carouselViewport}>
                                    {sampleTools.map((tool) => (
                                        <article key={tool.id} style={styles.card}>
                                            <div style={styles.cardImage}>
                                                {tool.image ? (
                                                    <img src={tool.image} alt={tool.name} style={{ maxHeight: "100%", borderRadius: 6 }} />
                                                ) : (
                                                    <div>{tool.category}</div>
                                                )}
                                            </div>
                                            <div style={{ fontWeight: 600 }}>{tool.name}</div>
                                            <div style={{ color: "#ddd", fontSize: 14 }}>{tool.description}</div>
                                            <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div style={{ fontWeight: 700 }}>€{tool.pricePerDay}/dia</div>
                                                <div>
                                                    <Link to={`/tools/${tool.id}`} style={{ textDecoration: "none", color: "#f8b749" }}>Detalhes</Link>
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
