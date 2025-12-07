import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';

type Tool = {
    id?: number;
    name: string;
    type: string;
    dailyPrice: number;        // ✅ camelCase
    depositAmount: number;     // ✅ camelCase
    description: string;
    location: string;
    available?: boolean;
    imageUrl?: string;         // ✅ camelCase
    ownerId?: number;          // ✅ camelCase
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
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${protocol}//${hostname}:${API_PORT}${normalized}`;
}

export default function AddTool(): React.ReactElement {
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

    const readStoredUser = () => {
        try {
            const userStr = localStorage.getItem('user');
            console.log('📦 Raw user from localStorage:', userStr);
            if (!userStr) return null;
            const parsed = JSON.parse(userStr);
            console.log('👤 Parsed user:', parsed);
            return parsed;
        } catch (e) {
            console.error('❌ Error parsing user:', e);
            return null;
        }
    };

    const getJwt = () => {
        const jwt = localStorage.getItem('jwt');
        console.log('🔑 JWT from localStorage:', jwt ? `${jwt.substring(0, 30)}...` : '❌ NOT FOUND');
        return jwt || undefined;
    };

    useEffect(() => {
        console.log('🚀 AddTool mounted - checking authentication');
        const stored = readStoredUser();
        const id = stored?.id ?? stored?.user_id ?? stored?.userId ?? null;

        console.log('🆔 User ID from localStorage:', id);

        if (id) {
            setCurrentUserId(Number(id));
            return;
        }

        const fetchMe = async () => {
            const jwt = getJwt();
            if (!jwt) {
                console.error('❌ No JWT found - redirecting to login');
                setError("Utilizador não identificado. Por favor faça login novamente.");
                setTimeout(() => navigate('/loginPage'), 2000);
                return;
            }

            console.log('📡 Fetching /api/auth/me with token...');
            try {
                const res = await fetch(apiUrl('/api/auth/me'), {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${jwt}`
                    }
                });

                console.log('📥 /api/auth/me response status:', res.status);
                console.log('📥 Response headers:', Object.fromEntries(res.headers.entries()));

                if (res.ok) {
                    const data = await res.json().catch(() => null);
                    console.log('✅ /api/auth/me data:', data);

                    if (data) {
                        const fetchedId = data?.id ?? data?.user_id ?? data?.userId ?? null;
                        if (fetchedId) {
                            console.log('🆔 User ID fetched:', fetchedId);
                            setCurrentUserId(Number(fetchedId));
                        }
                        const userToStore = {
                            username: data.username ?? stored?.username ?? '',
                            email: data.email ?? stored?.email,
                            role: data.role ?? stored?.role,
                            id: fetchedId
                        };
                        console.log('💾 Saving user to localStorage:', userToStore);
                        localStorage.setItem('user', JSON.stringify(userToStore));
                    }
                } else if (res.status === 401 || res.status === 403) {
                    console.error('🔒 Unauthorized/Forbidden - token invalid');
                    const errorText = await res.text().catch(() => '');
                    console.error('Error response:', errorText);
                    localStorage.removeItem('jwt');
                    localStorage.removeItem('user');
                    setError("Sessão expirada. Por favor faça login novamente.");
                    setTimeout(() => navigate('/loginPage'), 2000);
                } else {
                    const text = await res.text().catch(() => res.statusText);
                    console.error('❌ Error from /api/auth/me:', text);
                    setError(text || "Erro ao obter utilizador");
                }
            } catch (e: any) {
                console.error('💥 Exception in fetchMe:', e);
                setError("Erro ao obter utilizador");
            }
        };

        fetchMe();
    }, [navigate]);

    async function loadTools() {
        if (!currentUserId) {
            console.warn('⚠️ loadTools: no currentUserId');
            return;
        }

        console.log(`📡 Loading tools for user ${currentUserId}...`);
        setLoading(true);
        setError(null);

        try {
            const jwt = getJwt();
            const url = apiUrl(`/api/tools?owner_id=${currentUserId}`);

            console.log('📤 GET request:', url);
            console.log('🔑 JWT present:', !!jwt);

            const res = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {})
                }
            });

            console.log('📥 Response status:', res.status);

            if (!res.ok) {
                const text = await res.text();
                console.error('❌ Error:', text);
                throw new Error(text || res.statusText);
            }

            const data: Tool[] = await res.json();
            console.log('✅ Tools loaded:', data.length);
            setTools(data);
        } catch (e: any) {
            console.error('💥 Exception:', e);
            setError(e.message || "Erro ao carregar ferramentas");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (currentUserId) {
            console.log('🔄 currentUserId changed:', currentUserId);
            loadTools();
        }
    }, [currentUserId]);

    async function handleSubmit(e?: React.FormEvent) {
        e?.preventDefault();
        setError(null);

        console.log('📝 Form submit triggered');

        if (!name || !type || !dailyPrice || !depositAmount || !description || !location) {
            console.warn('⚠️ Missing required fields');
            setError("Preencha todos os campos obrigatórios");
            return;
        }

        if (!currentUserId) {
            console.error('❌ No currentUserId - cannot submit');
            setError("Utilizador não identificado. Por favor faça login novamente.");
            return;
        }

        const payload = {
            name,
            type,
            dailyPrice: Number(dailyPrice),        // ✅ camelCase
            depositAmount: Number(depositAmount),  // ✅ camelCase
            description,
            location,
            imageUrl: imageUrl || undefined,       // ✅ camelCase
            ownerId: currentUserId,                // ✅ camelCase
            available: true,
            status: "AVAILABLE"
        };

        console.log('📦 Payload:', payload);

        setLoading(true);
        try {
            const jwt = getJwt();

            if (!jwt) {
                console.error('❌ No JWT found before submit');
                throw new Error('Token de autenticação não encontrado');
            }

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${jwt}`
            };

            console.log('📨 Request headers:', headers);

            if (editingId) {
                const url = apiUrl(`/api/tools/${editingId}`);
                console.log(`📤 PUT ${url}`);
                const res = await fetch(url, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(payload)
                });

                console.log('📥 PUT response status:', res.status);
                console.log('📥 Response headers:', Object.fromEntries(res.headers.entries()));

                if (!res.ok) {
                    const text = await res.text();
                    console.error('❌ PUT error:', text);

                    if (res.status === 401 || res.status === 403) {
                        localStorage.removeItem('jwt');
                        localStorage.removeItem('user');
                        setError("Sessão expirada. Por favor faça login novamente.");
                        setTimeout(() => navigate('/loginPage'), 2000);
                        return;
                    }

                    throw new Error(text || res.statusText);
                }
                const updated: Tool = await res.json();
                setTools(prev => prev.map(t => (t.id === editingId ? updated : t)));
                alert("Ferramenta atualizada com sucesso!");
            } else {
                const url = apiUrl('/api/tools');
                console.log('📤 POST', url);
                const res = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload)
                });

                console.log('📥 POST response status:', res.status);
                console.log('📥 Response headers:', Object.fromEntries(res.headers.entries()));

                if (!res.ok) {
                    const text = await res.text();
                    console.error('❌ POST error response:', text);

                    if (res.status === 401 || res.status === 403) {
                        console.error('🔒 Authentication error - clearing storage');
                        localStorage.removeItem('jwt');
                        localStorage.removeItem('user');
                        setError("Sessão expirada. Por favor faça login novamente.");
                        setTimeout(() => navigate('/loginPage'), 2000);
                        return;
                    }

                    throw new Error(text || res.statusText);
                }
                const created: Tool = await res.json();
                console.log('✅ Tool created:', created);
                setTools(prev => [...prev, created]);
                alert("Ferramenta criada com sucesso!");
            }
            clearForm();
        } catch (e: any) {
            console.error('💥 Submit exception:', e);
            setError(e.message || "Erro ao submeter");
        } finally {
            setLoading(false);
        }
    }

    async function onDelete(id?: number) {
        if (!id) return;
        if (!confirm("Tem a certeza que pretende apagar esta ferramenta?")) return;

        console.log(`🗑️ Deleting tool ${id}`);
        setLoading(true);

        try {
            const jwt = getJwt();
            const url = apiUrl(`/api/tools/${id}`);
            const res = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {})
                }
            });

            console.log('📥 DELETE response status:', res.status);

            if (!res.ok) {
                const text = await res.text();
                console.error('❌ DELETE error:', text);

                if (res.status === 401 || res.status === 403) {
                    localStorage.removeItem('jwt');
                    localStorage.removeItem('user');
                    setError("Sessão expirada. Por favor faça login novamente.");
                    setTimeout(() => navigate('/loginPage'), 2000);
                    return;
                }

                throw new Error(text || res.statusText);
            }

            setTools(prev => prev.filter(t => t.id !== id));
            console.log('✅ Tool deleted');
            alert("Ferramenta apagada com sucesso!");
        } catch (e: any) {
            console.error('💥 Delete exception:', e);
            setError(e.message || "Erro ao apagar");
        } finally {
            setLoading(false);
        }
    }

    function clearForm() {
        console.log('🧹 Clearing form');
        setEditingId(null);
        setName("");
        setType("");
        setDailyPrice("");
        setDepositAmount("");
        setDescription("");
        setLocation("");
        setImageUrl("");
    }

    function onEdit(tool: Tool) {
        console.log('✏️ Editing tool:', tool);
        setEditingId(tool.id ?? null);
        setName(tool.name);
        setType(tool.type);
        setDailyPrice(String(tool.dailyPrice));      // ✅ camelCase
        setDepositAmount(String(tool.depositAmount)); // ✅ camelCase
        setDescription(tool.description);
        setLocation(tool.location);
        setImageUrl(tool.imageUrl || "");            // ✅ camelCase
        window.scrollTo({ top: 0, behavior: "smooth" });
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
                                <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Nome da Ferramenta *</label>
                                <input
                                    placeholder="Ex: Berbequim Bosch"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Categoria *</label>
                                <select
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
                                <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Preço por Dia (€) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="10.00"
                                    value={dailyPrice}
                                    onChange={(e) => setDailyPrice(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Caução (€) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="50.00"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Localização *</label>
                                <input
                                    placeholder="Ex: Lisboa, Coimbra"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>URL da Imagem</label>
                                <input
                                    placeholder="https://exemplo.com/imagem.jpg"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>Descrição *</label>
                            <textarea
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
                            {tools.map(tool => (
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
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
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
                                                    €{tool.dailyPrice.toFixed(2)}/dia
                                                </div>
                                                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                                                    Caução: €{tool.depositAmount.toFixed(2)}
                                                </div>
                                            </div>
                                        </div>

                                        <p style={{ margin: "8px 0", fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                                            {tool.description}
                                        </p>

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
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}