import './About.css';
import { Link } from "react-router-dom";
import logoImg from '../assets/craftingstable.png';
import bgImg from '../assets/rust.jpg';

export default function AboutPage() {
    const contributors = [
        { name: 'Filipe Sousa', avatar: 'https://github.com/FilipePinaSousa.png', role: 'Team Leader && DevOps Master' },
        { name: 'Daniel Simbe', avatar: 'https://github.com/dani1244.png', role: 'Product Owner' },
        { name: 'Gonçalo Calvo', avatar: 'https://github.com/Goncasgamer20.png', role: 'QA Engineer' },
    ];

    const renderCard = (key: number, contributor: { name: string; avatar: string; role: string }) => (
        <div className="card-container" key={key} style={{ width: 350 }}>
            <div className="inner-container">
                <div className="border-outer">
                    <div className="main-card" />
                </div>
                <div className="glow-layer-1" />
                <div className="glow-layer-2" />
            </div>

            <div className="overlay-1" />
            <div className="overlay-2" />
            <div className="background-glow" />

            <div className="content-container">
                <div
                    className="content-top"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 48,
                        paddingBottom: 16,
                        height: '100%',
                        textAlign: 'center'
                    }}
                >
                    <img
                        src={contributor.avatar}
                        alt={contributor.name}
                        style={{
                            width: 140,
                            height: 140,
                            borderRadius: 16,
                            objectFit: 'cover',
                            marginBottom: 18,
                            border: '2px solid rgba(255,255,255,0.06)'
                        }}
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ color: '#fff', fontWeight: 800, textTransform: 'uppercase', fontSize: 16 }}>
                            {contributor.name}
                        </span>
                        <span style={{ color: '#f8b749', fontWeight: 700, fontSize: 13 }}>
                            {contributor.role}
                        </span>
                    </div>
                </div>

                <hr className="divider" />
            </div>
        </div>
    );

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                backgroundImage: `url(${bgImg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                color: "#fff"
            }}
        >
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />

            <header
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 24px",
                    boxSizing: "border-box",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    position: "relative",
                    zIndex: 2
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Link to="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "inherit" }}>
                        <img src={logoImg} alt="Crafting Stable logo" style={{ width: 64 }} />
                        <div style={{ fontWeight: 700, fontSize: 20, color: "#f8b749" }}>CraftingStable</div>
                    </Link>

                    <nav style={{ display: "flex", gap: 12, fontFamily: "Inter, Arial, sans-serif" }}>
                        <Link to="/catalog" style={{ color: "#fff", textDecoration: "none" }}>Catálogo</Link>
                        <Link to="/about" style={{ color: "#fff", textDecoration: "none" }}>Sobre</Link>
                    </nav>
                </div>
                <a
                    href="/login"
                    style={{
                        padding: "8px 14px",
                        borderRadius: 8,
                        background: "#f8b749",
                        color: "#222",
                        textDecoration: "none",
                        fontWeight: 600
                    }}
                >
                    Iniciar sessão
                </a>
            </header>

            <main
                style={{
                    position: "relative",
                    zIndex: 2,
                    flex: 1,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "40px 0"
                }}
            >
                <main className="main-container" aria-hidden={false} style={{ position: "relative", zIndex: 3 }}>
                    <svg className="svg-container" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <defs>
                            <filter id="turbulent-displace" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
                                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noiseA" seed="1" />
                                <feOffset in="noiseA" dx="0" dy="0" result="offsetA">
                                    <animate attributeName="dy" values="700;0" dur="6s" repeatCount="indefinite" calcMode="linear" />
                                </feOffset>

                                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noiseB" seed="1" />
                                <feOffset in="noiseB" dx="0" dy="0" result="offsetB">
                                    <animate attributeName="dy" values="0;-700" dur="6s" repeatCount="indefinite" calcMode="linear" />
                                </feOffset>

                                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noiseC" seed="2" />
                                <feOffset in="noiseC" dx="0" dy="0" result="offsetC">
                                    <animate attributeName="dx" values="490;0" dur="6s" repeatCount="indefinite" calcMode="linear" />
                                </feOffset>

                                <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noiseD" seed="2" />
                                <feOffset in="noiseD" dx="0" dy="0" result="offsetD">
                                    <animate attributeName="dx" values="0;-490" dur="6s" repeatCount="indefinite" calcMode="linear" />
                                </feOffset>

                                <feComposite in="offsetA" in2="offsetB" result="part1" />
                                <feComposite in="offsetC" in2="offsetD" result="part2" />
                                <feBlend in="part1" in2="part2" mode="color-dodge" result="combinedNoise" />

                                <feDisplacementMap in="SourceGraphic" in2="combinedNoise" scale="30" xChannelSelector="R" yChannelSelector="B" />
                            </filter>
                        </defs>
                    </svg>

                    <div style={{ display: 'flex', gap: 24, justifyContent: 'center', alignItems: 'flex-start' }}>
                        {contributors.map((c, i) => renderCard(i, c))}
                    </div>
                </main>
            </main>

            <footer
                style={{
                    width: "100%",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    padding: "18px 0",
                    color: "rgba(255,255,255,0.9)",
                    textAlign: "center",
                    fontSize: 14,
                    position: "relative",
                    zIndex: 2
                }}
            >
                © {new Date().getFullYear()} Crafting Stable — Aluguer de ferramentas.
            </footer>
        </div>
    );
}
