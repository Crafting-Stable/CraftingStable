import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from '../../components/Header';

type Tool = {
    id?: number;
    name: string;
    type: string;
    dailyPrice: number;
    depositAmount: number;
    description: string;
    location: string;
    available?: boolean;
    imageUrl?: string;
    ownerId?: number;
    status?: string;
};

const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    padding: 20,
    fontFamily: "Inter, Arial, sans-serif",
    color: "#fff",
    background: "linear-gradient(180deg, rgba(10,10,10,0.6), rgba(0,0,0,0.8))"
};

const API_PORT = '8081';

function apiUrl(path: string) {
    const protocol = globalThis.location.protocol;
    const hostname = globalThis.location.hostname;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${protocol}//${hostname}:${API_PORT}${normalized}`;
}

/* Helpers moved to module scope to avoid deep nesting inside the component */
function readStoredUser() {
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        return JSON.parse(userStr);
    } catch {
        return null;
    }
}

function getJwt() {
    return localStorage.getItem('jwt') || undefined;
}

async function fetchAndStoreMe(
    navigate: (path: string) => void,
    setError: (s: string | null) => void,
    setCurrentUserId: (id: number | null) => void
) {
    const jwt = getJwt();
    if (!jwt) {
        setError("Utilizador não identificado. Por favor faça login novamente.");
        setTimeout(() => navigate('/loginPage'), 1500);
        return null;
    }

    try {
        const res = await fetch(apiUrl('/api/auth/me'), {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${jwt}`
            }
        });

        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('jwt');
            localStorage.removeItem('user');
            setError("Sessão expirada. Por favor faça login novamente.");
            setTimeout(() => navigate('/loginPage'), 1500);
            return null;
        }

        if (!res.ok) {
            const text = await res.text().catch(() => res.statusText);
            setError(text || "Erro ao obter utilizador");
            return null;
        }

        const data = await res.json().catch(() => null);
        if (data) {
            const fetchedId = data?.id ?? data?.user_id ?? data?.userId ?? null;
            if (fetchedId) setCurrentUserId(Number(fetchedId));
            const userToStore = {
                username: data.username ?? '',
                email: data.email ?? '',
                role: data.role ?? '',
                id: fetchedId
            };
            localStorage.setItem('user', JSON.stringify(userToStore));
            return data;
        }
    } catch {
        setError("Erro ao obter utilizador");
    }
    return null;
}

export default function AddRent(): React.ReactElement {
    const navigate = useNavigate();
    const [tools, setTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [name, setName] = useState("");
    const [type, setType] = useState("");
    const [dailyPrice, setDailyPrice] = useState("");
    const [depositAmount, setDepositAmount] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    function signOutAndRedirect(msg = "Sessão expirada. Por favor faça login novamente.") {
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
        setError(msg);
        setTimeout(() => navigate('/loginPage'), 1500);
    }

    async function sendRequest<T = any>(method: string, url: string, body?: any): Promise<T> {
        const jwt = getJwt();
        if (!jwt) {
            signOutAndRedirect("Token de autenticação não encontrado. Por favor faça login novamente.");
            throw new Error('auth');
        }

        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'Authorization': `Bearer ${jwt}`
        };

        const hasBody = body !== undefined;
        if (hasBody) headers['Content-Type'] = 'application/json';

        const res = await fetch(url, {
            method,
            headers,
            body: hasBody ? JSON.stringify(body) : undefined
        });

        if (res.status === 401 || res.status === 403) {
            signOutAndRedirect();
            throw new Error('auth');
        }

        if (!res.ok) {
            const text = await res.text().catch(() => res.statusText);
            throw new Error(text || res.statusText);
        }

        if (res.status === 204) return {} as T;

        return await res.json().catch(() => ({} as T));
    }

    useEffect(() => {
        const stored = readStoredUser();
        const id = stored?.id ?? stored?.user_id ?? stored?.userId ?? null;
        if (id) {
            setCurrentUserId(Number(id));
            return;
        }
        // chama a função movida para o escopo do módulo
        fetchAndStoreMe(navigate, setError, setCurrentUserId);
    }, [navigate]);

    async function loadTools() {
        if (!currentUserId) return;
        setLoading(true);
        setError(null);
        try {
            const url = apiUrl(`/api/tools?owner_id=${currentUserId}`);
            const data = await sendRequest<Tool[]>('GET', url);
            const filtered = Array.isArray(data) ? data.filter(t => Number(t.ownerId) === Number(currentUserId)) : [];
            setTools(filtered);
        } catch (e: any) {
            if (e.message !== 'auth') setError(e.message || "Erro ao carregar ferramentas");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (currentUserId) loadTools();
    }, [currentUserId]);

    function clearForm() {
        setEditingId(null);
        setName("");
        setType("");
        setDailyPrice("");
        setDepositAmount("");
        setDescription("");
        setLocation("");
        setImageUrl("");
        setError(null);
    }

    async function handleCreated(created: Tool) {
        if (Number(created.ownerId) === Number(currentUserId)) {
            setTools(prev => [...prev, created]);
        } else {
            await loadTools();
        }
        alert("Ferramenta criada com sucesso!");
    }

    async function handleUpdated(updated: Tool, id: number | null) {
        if (Number(updated.ownerId) === Number(currentUserId)) {
            setTools(prev => prev.map(t => (t.id === id ? updated : t)));
        } else {
            await loadTools();
        }
        alert("Ferramenta atualizada com sucesso!");
    }

    async function handleSubmit(e?: React.FormEvent) {
        e?.preventDefault();
        setError(null);

        if (!name || !type || !dailyPrice || !depositAmount || !description || !location) {
            setError("Preencha todos os campos obrigatórios");
            return;
        }

        if (!currentUserId) {
            setError("Utilizador não identificado. Por favor faça login novamente.");
            return;
        }

        const payload = {
            name,
            type,
            dailyPrice: Number(dailyPrice),
            depositAmount: Number(depositAmount),
            description,
            location,
            imageUrl: imageUrl || undefined,
            ownerId: currentUserId,
            available: true,
            status: "AVAILABLE"
        };

        setLoading(true);
        try {
            if (editingId) {
                const url = apiUrl(`/api/tools/${editingId}`);
                const updated = await sendRequest<Tool>('PUT', url, payload);
                await handleUpdated(updated, editingId);
            } else {
                const url = apiUrl('/api/tools');
                const created = await sendRequest<Tool>('POST', url, payload);
                await handleCreated(created);
            }
            clearForm();
        } catch (e: any) {
            if (e.message !== 'auth') setError(e.message || "Erro ao submeter");
        } finally {
            setLoading(false);
        }
    }

    function onEdit(tool: Tool) {
        if (Number(tool.ownerId) !== Number(currentUserId)) {
            setError("Não tem permissão para editar esta ferramenta.");
            return;
        }
        setEditingId(tool.id ?? null);
        setName(tool.name);
        setType(tool.type);
        setDailyPrice(String(tool.dailyPrice));
        setDepositAmount(String(tool.depositAmount));
        setDescription(tool.description);
        setLocation(tool.location);
        setImageUrl(tool.imageUrl || "");
        globalThis.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function onDelete(id?: number) {
        if (!id) return;
        const tool = tools.find(t => t.id === id);
        if (!tool) return;
        if (Number(tool.ownerId) !== Number(currentUserId)) {
            setError("Não tem permissão para apagar esta ferramenta.");
            return;
        }
        if (!confirm("Tem a certeza que pretende apagar esta ferramenta?")) return;

        setLoading(true);
        try {
            const url = apiUrl(`/api/tools/${id}`);
            await sendRequest('DELETE', url);
            setTools(prev => prev.filter(t => t.id !== id));
            alert("Ferramenta apagada com sucesso!");
        } catch (e: any) {
            if (e.message !== 'auth') setError(e.message || "Erro ao apagar");
        } finally {
            setLoading(false);
        }
    }

    /* pequenas funções auxiliares para reduzir arrow functions inline */
    function handleImageError(e: React.SyntheticEvent<HTMLImageElement>) {
        e.currentTarget.style.display = 'none';
    }

    function renderTool(tool: Tool) {
        return (
            <div
                key={tool.id}
                style={{
                    padding: 16,
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    gap: 16,
                    alignItems: "flex-start"
                }}
            >
                {tool.imageUrl && (
                    <img
                        src={tool.imageUrl}
                        alt={tool.name}
                        style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
                        onError={handleImageError}
                    />
                )}

                <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                            <h4 style={{ margin: 0, fontSize: 18 }}>{tool.name}</h4>
                            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                                {tool.type} • {tool.location}
                            </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 20, fontWeight: 700, color: "#f8b749" }}>
                                €{(tool.dailyPrice ?? 0).toFixed(2)}/dia
                            </div>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                                Caução: €{(tool.depositAmount ?? 0).toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <p style={{ margin: "8px 0", fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                        {tool.description}
                    </p>

                    {Number(tool.ownerId) === Number(currentUserId) ? (
                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                            <button
                                onClick={() => onEdit(tool)}
                                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
                            >
                                Editar
                            </button>
                            <button
                                onClick={() => onDelete(tool.id)}
                                style={{ background: "#ff5c5c", border: "none", color: "#fff", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
                            >
                                Apagar
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        );
    }

    const inputStyle: React.CSSProperties = {
        padding: "10px 12px",
        borderRadius: 6,
        border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(255,255,255,0.05)",
        color: "#fff",
        width: "100%",
        fontSize: 14
    };

    return (
        <div style={pageStyle}>
            <Header />

            <header style={{ padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: 20 }}>
                <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h1 style={{ margin: 0, fontSize: 24 }}>Minhas Ferramentas</h1>
                    <button
                        onClick={() => navigate('/catalog')}
                        style={{ background: "transparent", border: "1px solid #f8b749", color: "#f8b749", padding: "8px 16px", borderRadius: 6, cursor: "pointer" }}
                    >
                        Ver Catálogo
                    </button>
                </div>
            </header>

            <main style={{ maxWidth: 1100, margin: "0 auto" }}>
                <section style={{ marginBottom: 24, background: "rgba(0,0,0,0.6)", padding: 24, borderRadius: 10 }}>
                    <h2 style={{ margin: "0 0 16px 0", fontSize: 20 }}>
                        {editingId ? "Editar Ferramenta" : "Criar Novo Anúncio"}
                    </h2>

                    <div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 16 }}>
                            <div>
                                <label htmlFor="name-input" style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Nome da Ferramenta *</label>
                                <input
                                    id="name-input"
                                    placeholder="Ex: Berbequim Bosch"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label htmlFor="type-select" style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Categoria *</label>
                                <select
                                    id="type-select"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    style={{ ...inputStyle, cursor: "pointer" }}
                                >
                                    <option value="">Selecione uma categoria</option>
                                    <option value="Jardinagem">Jardinagem</option>
                                    <option value="Obras">Obras</option>
                                    <option value="Carpintaria">Carpintaria</option>
                                    <option value="Elétricas">Elétricas</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="dailyPrice-input" style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Preço por Dia (€) *</label>
                                <input
                                    id="dailyPrice-input"
                                    type="number"
                                    step="0.01"
                                    placeholder="10.00"
                                    value={dailyPrice}
                                    onChange={(e) => setDailyPrice(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label htmlFor="depositAmount-input" style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Caução (€) *</label>
                                <input
                                    id="depositAmount-input"
                                    type="number"
                                    step="0.01"
                                    placeholder="50.00"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label htmlFor="location-input" style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Localização *</label>
                                <input
                                    id="location-input"
                                    placeholder="Ex: Lisboa, Coimbra"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label htmlFor="imageUrl-input" style={{ display: "block", marginBottom: 6, fontSize: 14 }}>URL da Imagem</label>
                                <input
                                    id="imageUrl-input"
                                    placeholder="https://exemplo.com/imagem.jpg"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label htmlFor="description-textarea" style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Descrição *</label>
                            <textarea
                                id="description-textarea"
                                placeholder="Descreva a ferramenta, estado, características..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                style={{ ...inputStyle, resize: "vertical" }}
                            />
                        </div>

                        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                            <button
                                type="button"
                                onClick={clearForm}
                                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", padding: "10px 20px", borderRadius: 6, cursor: "pointer" }}
                            >
                                Limpar
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                style={{ background: "#f8b749", color: "#111", padding: "10px 24px", borderRadius: 6, fontWeight: 700, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
                            >
                                {loading ? "A processar..." : editingId ? "Atualizar" : "Criar Anúncio"}
                            </button>
                        </div>
                    </div>

                    {error && <div style={{ marginTop: 12, padding: 12, background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.3)", borderRadius: 6, color: "#ffb4b4" }}>{error}</div>}
                </section>

                <section style={{ background: "rgba(0,0,0,0.6)", padding: 24, borderRadius: 10 }}>
                    <h3 style={{ margin: "0 0 16px 0" }}>Meus Anúncios ({tools.length})</h3>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.5)" }}>
                            A carregar...
                        </div>
                    ) : tools.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.5)" }}>
                            Ainda não criou nenhum anúncio. Crie o seu primeiro anúncio acima!
                        </div>
                    ) : (
                        <div style={{ display: "grid", gap: 16 }}>
                            {tools.map(renderTool)}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
