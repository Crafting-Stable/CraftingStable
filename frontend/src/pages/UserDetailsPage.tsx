import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import craftingstable from '../assets/craftingstable.png';

type User = { username: string; email?: string; role?: string; id?: number } | null;

interface Rent {
    id: number;
    toolId: number;
    userId: number;
    status: string;
    startDate: string;
    endDate: string;
    message?: string;
}

interface Tool {
    id: number;
    name: string;
    ownerId: number;
}

const API_PORT = '8081';

function apiUrl(path: string): string {
    const protocol = globalThis.location.protocol;
    const hostname = globalThis.location.hostname;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${protocol}//${hostname}:${API_PORT}${normalized}`;
}

const STATUS_STYLES: Record<string, { background: string; color: string }> = {
    PENDING: { background: '#fef3c7', color: '#92400e' },
    APPROVED: { background: '#d1fae5', color: '#065f46' },
    REJECTED: { background: '#fee2e2', color: '#991b1b' },
    ACTIVE: { background: '#dbeafe', color: '#1e40af' },
    COMPLETED: { background: '#f3f4f6', color: '#374151' },
    CANCELLED: { background: '#f3f4f6', color: '#374151' }
};

function getStatusStyles(status: string) {
    return STATUS_STYLES[status] ?? { background: '#f3f4f6', color: '#374151' };
}

function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
        PENDING: '⏳ Pendente',
        APPROVED: '✅ Aprovado',
        REJECTED: '❌ Rejeitado',
        ACTIVE: '🚀 Ativo',
        COMPLETED: '✔️ Concluído',
        CANCELLED: '🚫 Cancelado'
    };
    return labels[status] ?? status;
}

interface HeaderProps {
    onBack: () => void;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onBack, onLogout }) => (
    <header style={{ width: '100%', maxWidth: 1100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={craftingstable} alt="logo" style={{ width: 48 }} />
            <div style={{ fontWeight: 700 }}>CraftingStable</div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={onBack} style={{ marginRight: 12 }}>Voltar</button>
            <button onClick={onLogout} style={{ background: '#f8b749', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>Sair</button>
        </div>
    </header>
);

interface RentItemProps {
    rent: Rent;
    tools: Map<number, Tool>;
}

const RentItem: React.FC<RentItemProps> = ({ rent, tools }) => {
    const { background, color } = getStatusStyles(rent.status);
    const statusLabel = getStatusLabel(rent.status);
    return (
        <div key={rent.id} style={{ border: '1px solid #e5e5e5', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                    <h3 style={{ margin: '0 0 8px 0' }}>
                        {tools.get(rent.toolId)?.name || `Ferramenta #${rent.toolId}`}
                    </h3>
                    <p style={{ margin: '4px 0', fontSize: 14, color: '#666' }}>
                        📅 {new Date(rent.startDate).toLocaleDateString('pt-PT')} - {new Date(rent.endDate).toLocaleDateString('pt-PT')}
                    </p>
                    {rent.message && (
                        <p style={{ margin: '8px 0 0 0', fontSize: 13, color: '#999', fontStyle: 'italic' }}>
                            💬 {rent.message}
                        </p>
                    )}
                </div>
                <span style={{
                    padding: '6px 14px',
                    borderRadius: 16,
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background,
                    color
                }}>
                    {statusLabel}
                </span>
            </div>
        </div>
    );
};

export default function UserDetailsPage(): React.ReactElement {
    const navigate = useNavigate();
    const [user, setUser] = useState<User>(null);
    const [loading, setLoading] = useState(true);
    const [myRents, setMyRents] = useState<Rent[]>([]);
    const [pendingRents, setPendingRents] = useState<Rent[]>([]);
    const [tools, setTools] = useState<Map<number, Tool>>(new Map());
    const [loadingRents, setLoadingRents] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'myRents' | 'pending'>('profile');

    // Load user (from localStorage or /api/auth/me)
    const loadUserAndRents = useCallback(async () => {
        setLoading(true);
        try {
            const raw = localStorage.getItem('user');
            let parsed: User = raw ? JSON.parse(raw) : null;
            const token = localStorage.getItem('jwt');

            if (token && (!parsed?.email)) {
                try {
                    const res = await fetch(apiUrl('/api/auth/me'), {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (res.ok) {
                        const data = await res.json().catch(() => null);
                        if (data) {
                            parsed = {
                                id: data.id,
                                username: data.username ?? parsed?.username ?? '',
                                email: data.email ?? parsed?.email,
                                role: data.role ?? parsed?.role
                            };
                            localStorage.setItem('user', JSON.stringify(parsed));
                        }
                    } else if (res.status === 401) {
                        localStorage.removeItem('jwt');
                        localStorage.removeItem('user');
                        parsed = null;
                    }
                } catch {
                    // ignore
                }
            }

            setUser(parsed);
            if (parsed?.id) {
                await loadRents(parsed.id);
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUserAndRents();
    }, [loadUserAndRents]);

    const loadRents = useCallback(async (userId: number) => {
        setLoadingRents(true);
        const token = localStorage.getItem('jwt');
        if (!token) {
            setLoadingRents(false);
            return;
        }

        try {
            const [rentsResponse, toolsResponse] = await Promise.all([
                fetch(apiUrl('/api/rents'), { headers: { Authorization: `Bearer ${token}` } }),
                fetch(apiUrl('/api/tools'), { headers: { Authorization: `Bearer ${token}` } })
            ]);

            const allRents: Rent[] = await rentsResponse.json().catch(() => []);
            const allTools: Tool[] = await toolsResponse.json().catch(() => []);

            const toolsMap = new Map(allTools.map(t => [t.id, t]));
            setTools(toolsMap);

            setMyRents(allRents.filter(r => r.userId === userId));

            const myToolIds = allTools.filter(t => t.ownerId === userId).map(t => t.id);
            setPendingRents(allRents.filter(r => myToolIds.includes(r.toolId) && r.status === 'PENDING'));
        } catch (error) {
            console.error('Failed to load rents:', error);
        } finally {
            setLoadingRents(false);
        }
    }, []);

    const performPutAction = useCallback(async (url: string, successMsg: string, refreshOwnerId?: number) => {
        const token = localStorage.getItem('jwt');
        if (!token) return;

        try {
            const response = await fetch(url, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
            if (response.ok) {
                if (successMsg) alert(successMsg);
                if (refreshOwnerId) await loadRents(refreshOwnerId);
            } else {
                const error = await response.text();
                alert(`Erro: ${error}`);
            }
        } catch (error) {
            console.error('Action failed:', error);
            alert('Erro na ação');
        }
    }, [loadRents]);

    const handleApprove = useCallback((rentId: number) => {
        if (!user?.id) return;
        const url = apiUrl(`/api/rents/${rentId}/approve?ownerId=${user.id}`);
        performPutAction(url, 'Reserva aprovada com sucesso!', user.id);
    }, [user, performPutAction]);

    const handleReject = useCallback((rentId: number) => {
        if (!user?.id) return;
        const reason = prompt('Motivo da rejeição (opcional):') ?? '';
        const url = apiUrl(`/api/rents/${rentId}/reject?ownerId=${user.id}${reason ? `&message=${encodeURIComponent(reason)}` : ''}`);
        performPutAction(url, 'Reserva rejeitada', user.id);
    }, [user, performPutAction]);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
        navigate('/');
    }, [navigate]);

    if (loading) return <div style={{ padding: 24 }}>A carregar...</div>;

    if (!user) {
        return (
            <div style={{ padding: 24 }}>
                <h2>Não autenticado</h2>
                <p>Não foi possível encontrar dados de utilizador.</p>
                <button onClick={() => navigate('/loginPage')}>Ir para Login</button>
            </div>
        );
    }

    // Small presentational components
    const Tabs = () => (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: '#fff', padding: 8, borderRadius: 8 }}>
            {[
                { key: 'profile', label: '👤 Perfil' },
                { key: 'myRents', label: `📦 Minhas Reservas (${myRents.length})` },
                { key: 'pending', label: `⏳ Pendentes (${pendingRents.length})` }
            ].map((t: any) => {
                const active = activeTab === t.key;
                return (
                    <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key)}
                        style={{
                            flex: 1,
                            padding: '12px 20px',
                            border: 'none',
                            borderRadius: 6,
                            background: active ? '#f8b749' : 'transparent',
                            color: active ? '#000' : '#666',
                            fontWeight: active ? 700 : 400,
                            cursor: 'pointer'
                        }}
                    >
                        {t.label}
                    </button>
                );
            })}
        </div>
    );

    const ProfileView = () => (
        <div style={{ background: '#fff', padding: 28, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2>Perfil</h2>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginTop: 12 }}>
                <div style={{ width: 72, height: 72, borderRadius: 36, background: '#fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 28 }}>
                    {user.username ? user.username[0].toUpperCase() : 'U'}
                </div>
                <div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{user.username}</div>
                    <div style={{ color: '#666', fontSize: 14 }}>{user.role ?? 'Utilizador'}</div>
                    <div style={{ color: '#999', marginTop: 4 }}>{user.email ?? 'Email não disponível'}</div>
                </div>
            </div>
        </div>
    );

    const MyRentsView = () => (
        <div style={{ background: '#fff', padding: 28, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2>Minhas Reservas</h2>
            {loadingRents ? (
                <p>A carregar reservas...</p>
            ) : myRents.length === 0 ? (
                <p style={{ color: '#666' }}>Ainda não tem reservas.</p>
            ) : (
                <div style={{ display: 'grid', gap: 16, marginTop: 20 }}>
                    {myRents.map(r => <RentItem key={r.id} rent={r} tools={tools} />)}
                </div>
            )}
        </div>
    );

    const PendingItem = ({ rent }: { rent: Rent }) => (
        <div key={rent.id} style={{ border: '2px solid #fbbf24', borderRadius: 8, padding: 16, background: '#fffbeb' }}>
            <div>
                <h3 style={{ margin: '0 0 8px 0' }}>
                    {tools.get(rent.toolId)?.name || `Ferramenta #${rent.toolId}`}
                </h3>
                <p style={{ margin: '4px 0', fontSize: 14, color: '#666' }}>👤 Utilizador ID: {rent.userId}</p>
                <p style={{ margin: '4px 0', fontSize: 14, color: '#666' }}>
                    📅 Período: {new Date(rent.startDate).toLocaleDateString('pt-PT')} até {new Date(rent.endDate).toLocaleDateString('pt-PT')}
                </p>
                <p style={{ margin: '4px 0', fontSize: 14, color: '#666' }}>🔖 ID Reserva: #{rent.id}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button
                    onClick={() => handleApprove(rent.id)}
                    style={{
                        flex: 1,
                        padding: '10px',
                        border: 'none',
                        borderRadius: 6,
                        background: '#22c55e',
                        color: '#fff',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    ✓ Aprovar
                </button>
                <button
                    onClick={() => handleReject(rent.id)}
                    style={{
                        flex: 1,
                        padding: '10px',
                        border: 'none',
                        borderRadius: 6,
                        background: '#ef4444',
                        color: '#fff',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    ✗ Rejeitar
                </button>
            </div>
        </div>
    );

    const PendingView = () => (
        <div style={{ background: '#fff', padding: 28, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#1f2937' }}>Reservas Pendentes nas Suas Ferramentas</h2>
            <p style={{ color: '#6b7280', fontSize: 14, marginTop: 8 }}>
                Aqui aparecem reservas que outros utilizadores fizeram nas suas ferramentas e aguardam aprovação.
            </p>
            {loadingRents ? (
                <p style={{ color: '#666', marginTop: 20 }}>🔄 A carregar reservas...</p>
            ) : pendingRents.length === 0 ? (
                <div style={{
                    background: '#f3f4f6',
                    padding: 20,
                    borderRadius: 8,
                    marginTop: 20,
                    textAlign: 'center',
                    color: '#6b7280'
                }}>
                    <p style={{ fontSize: 16, margin: 0 }}>✅ Não há reservas pendentes no momento</p>
                    <p style={{ fontSize: 13, marginTop: 8, color: '#9ca3af' }}>
                        Quando alguém reservar uma das suas ferramentas, aparecerá aqui para aprovação.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 16, marginTop: 20 }}>
                    {pendingRents.map(r => <PendingItem key={r.id} rent={r} />)}
                </div>
            )}
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24, background: '#f5f5f5' }}>
            <Header onBack={() => navigate('/')} onLogout={handleLogout} />
            <main style={{ width: '100%', maxWidth: 1100 }}>
                <Tabs />
                {activeTab === 'profile' && <ProfileView />}
                {activeTab === 'myRents' && <MyRentsView />}
                {activeTab === 'pending' && <PendingView />}
            </main>
        </div>
    );
}