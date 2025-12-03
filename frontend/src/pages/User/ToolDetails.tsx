import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
    const [tool, setTool] = useState<Tool | null>(null);
    const [loading, setLoading] = useState(true);

    const placeholderFor = (type: string, name?: string) =>
        `https://placehold.co/800x500?text=${encodeURIComponent((name || type).slice(0, 40))}`;

    async function fetchWiki(name: string) {
        // tenta resumo do Wikipedia (pt/en) e, se necessário, imagem do Wikidata Commons
        const langs = ["pt", "en"];
        for (const lang of langs) {
            try {
                const sUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(
                    name
                )}&srlimit=1&origin=*`;
                const sResp = await fetch(sUrl);
                if (!sResp.ok) continue;
                const sJson = await sResp.json();
                const first = sJson.query?.search?.[0];
                if (!first) continue;
                const title = first.title.replace(/ /g, "_");
                const sumResp = await fetch(
                    `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
                );
                if (sumResp.ok) {
                    const sumJson = await sumResp.json();
                    return {
                        extract: sumJson.extract,
                        thumbnail: sumJson.thumbnail?.source
                    };
                }
            } catch {
                /* ignore */
            }
        }

        // fallback: tenta imagem via Wikidata
        try {
            const sd = `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=pt&type=item&search=${encodeURIComponent(
                name
            )}&origin=*`;
            const sdResp = await fetch(sd);
            if (!sdResp.ok) return null;
            const sdJson = await sdResp.json();
            const first = sdJson.search?.[0];
            if (!first) return null;
            const id = first.id;
            const gUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&ids=${encodeURIComponent(
                id
            )}&props=claims&origin=*`;
            const gResp = await fetch(gUrl);
            if (!gResp.ok) return null;
            const gJson = await gResp.json();
            const entity = gJson.entities?.[id];
            const claims = entity?.claims?.P18;
            if (Array.isArray(claims) && claims.length > 0) {
                let fileName = claims[0].mainsnak?.datavalue?.value;
                if (fileName) {
                    fileName = fileName.replace(/^File:/i, "").trim();
                    const encoded = encodeURIComponent(fileName).replace(/\+/g, "%20");
                    const imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}`;
                    return { extract: first.description || null, thumbnail: imageUrl };
                }
            }
        } catch {
            /* ignore */
        }
        return null;
    }

    useEffect(() => {
        let mounted = true;
        async function load() {
            setLoading(true);
            try {
                let data: any = null;
                // tenta endpoint singular, se falhar pega lista e procura
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

                // enriquecer se falta imagem/descrição
                const needImage = !mapped.image || mapped.image.includes("placehold.co");
                const needDescription = !mapped.description;
                if (needImage || needDescription) {
                    const w = await fetchWiki(mapped.name);
                    const image = mapped.image && !mapped.image.includes("placehold.co") ? mapped.image : w?.thumbnail;
                    const description = mapped.description || w?.extract;
                    mapped.image = image ?? placeholderFor(mapped.category, mapped.name);
                    mapped.description = description ?? undefined;
                } else {
                    mapped.image = mapped.image ?? placeholderFor(mapped.category, mapped.name);
                }

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
                    </div>
                </div>
            </main>
        </div>
    );
}
