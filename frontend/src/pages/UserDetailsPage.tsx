import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import craftingstable from '../assets/craftingstable.png';
import bgImg from '../assets/rust.jpg';

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
    status: string;
}

const styles: { [k: string]: React.CSSProperties } = {
    root: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        backgroundImage: `url(${bgImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: '#a19b9b',
    },
    overlay: {
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
    },
    content: {
        position: 'relative',
        zIndex: 2,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 24,
        boxSizing: 'border-box',
        flex: 1
    },
    container: {
        width: '100%',
        maxWidth: 1100,
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
    },
    footer: {
        width: '100%',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '18px 0',
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        fontSize: 14,
        boxSizing: 'border-box',
        background: 'transparent',
        marginTop: 24
    }
};

const API_PORT = '8081';

function apiUrl(path: string): string {
    const protocol = globalThis.location.protocol;
    const hostname = globalThis.location.hostname;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${protocol}//${hostname}:${API_PORT}${normalized}`;
}

/* Helper de logging seguro sem usar `any` */
function safeError(...args: unknown[]) {
    try {
        const msg = args.map(a => {
            if (typeof a === 'string') return a;
            if (a === undefined) return 'undefined';
            if (a === null) return 'null';
            if (typeof a === 'object') {
                try {
                    return JSON.stringify(a);
                } catch {
                    return String(a);
                }
            }
            return String(a);
        }).join(' ');
        /* eslint-disable-next-line no-console */
        console.error(msg);
    } catch (e) {
        /* eslint-disable-next-line no-console */
        console.error('Erro (não foi possível serializar argumentos):', e);
    }
}

/* Header e componentes locais */
const STATUS_STYLES: Record<string, { background: string; color: string }> = {
    PENDING: { background: '#fef3c7', color: '#92400e' },
    APPROVED: { background: '#d1fae5', color: '#065f46' },
    REJECTED: { background: '#fee2e2', color: '#991b1b' },
    ACTIVE: { background: '#dbeafe', color: '#1e40af' },
    FINISHED: { background: '#f3f4f6', color: '#374151' },
    CANCELED: { background: '#f3f4f6', color: '#374151' }
};

const TOOL_STATUS_STYLES: Record<string, { background: string; color: string; label: string }> = {
    AVAILABLE: { background: '#d1fae5', color: '#065f46', label: '✅ Disponível' },
    RENTED: { background: '#dbeafe', color: '#1e40af', label: '📦 Alugado' },
    UNDER_MAINTENANCE: { background: '#fef3c7', color: '#92400e', label: '🔧 Manutenção' },
    INACTIVE: { background: '#fee2e2', color: '#991b1b', label: '⛔ Inativo' }
};

function getStatusStyles(status: string) {
    return STATUS_STYLES[status] ?? { background: '#f3f4f6', color: '#374151' };
}

function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
        PENDING: '⏳ Pendente Aprovação',
        APPROVED: '✅ Aprovado',
        REJECTED: '❌ Rejeitado',
        ACTIVE: '🚀 Ativo',
        FINISHED: '✔️ Concluído',
        CANCELED: '🚫 Cancelado'
    };
    return labels[status] ?? status;
}

function getToolStatusInfo(status: string) {
    return TOOL_STATUS_STYLES[status] ?? { background: '#f3f4f6', color: '#374151', label: status };
}

interface HeaderProps {
    onBack: () => void;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onBack, onLogout }) => (
    <header style={{ width: '100%', maxWidth: 1100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={craftingstable} alt="logo" style={{ width: 48 }} />
            <div style={{ fontWeight: 700, color: '#fff' }}>CraftingStable</div>
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
    userId?: number;
    onCancel?: (rentId: number) => void;
}

const RentItem: React.FC<RentItemProps> = ({ rent, tools, userId, onCancel }) => {
    const { background, color } = getStatusStyles(rent.status);
    const statusLabel = getStatusLabel(rent.status);
    const canCancel = userId && rent.userId === userId && (rent.status === 'PENDING' || rent.status === 'APPROVED');

    const tool = tools.get(rent.toolId);
    const toolDisplay = tool ? `${tool.name} (#${tool.id})` : `Ferramenta #${rent.toolId}`;

    return (
        <div key={rent.id} style={{ border: '1px solid #e5e5e5', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                    <div style={{ fontWeight: 700 }}>{toolDisplay}</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>{rent.startDate} → {rent.endDate}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ background, color, padding: '6px 8px', borderRadius: 6 }}>{statusLabel}</div>
                    {canCancel && <button onClick={() => onCancel?.(rent.id)} style={{ marginTop: 8 }}>Cancelar</button>}
                </div>
            </div>
        </div>
    );
};

type TabKey = 'profile' | 'myRents' | 'pending' | 'myTools';

interface TabsProps {
    activeTab: TabKey;
    onTabChange: (tab: TabKey) => void;
    myRentsCount: number;
    pendingRentsCount: number;
    myToolsCount: number;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange, myRentsCount, pendingRentsCount, myToolsCount }) => (
    <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: '#fff', padding: 8, borderRadius: 8, flexWrap: 'wrap' }}>
        {[
            { key: 'profile' as const, label: '👤 Perfil' },
            { key: 'myRents' as const, label: `📦 Minhas Reservas (${myRentsCount})` },
            { key: 'pending' as const, label: `⏳ Pendentes (${pendingRentsCount})` },
            { key: 'myTools' as const, label: `🛠️ Minhas Ferramentas (${myToolsCount})` }
        ].map((t) => (
            <button
                key={t.key}
                onClick={() => onTabChange(t.key)}
                style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    background: activeTab === t.key ? '#f8b749' : 'transparent',
                    fontWeight: activeTab === t.key ? 700 : 500
                }}
            >
                {t.label}
            </button>
        ))}
    </div>
);

interface ProfileViewProps {
    user: User;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user }) => {
    if (!user) return null;

    const firstLetter = user.username ? user.username[0].toUpperCase() : 'U';
    const role = user.role ?? 'Utilizador';
    const email = user.email ?? 'Email não disponível';

    return (
        <div style={{ background: '#fff', padding: 28, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2>Perfil</h2>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginTop: 12 }}>
                <div style={{ width: 64, height: 64, borderRadius: 64, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{firstLetter}</div>
                <div>
                    <div style={{ fontWeight: 700 }}>{user.username}</div>
                    <div style={{ color: '#6b7280' }}>{email}</div>
                    <div style={{ marginTop: 8, color: '#6b7280' }}>{role}</div>
                </div>
            </div>
        </div>
    );
};

interface MyRentsViewProps {
    myRents: Rent[];
    tools: Map<number, Tool>;
    loadingRents: boolean;
    userId?: number;
    onCancel?: (rentId: number) => void;
}

const MyRentsView: React.FC<MyRentsViewProps> = ({ myRents, tools, loadingRents, userId, onCancel }) => {
    let content;

    if (loadingRents) {
        content = <p>A carregar reservas...</p>;
    } else if (myRents.length === 0) {
        content = <p>Nenhuma reserva encontrada.</p>;
    } else {
        content = <div style={{ display: 'grid', gap: 12 }}>{myRents.map(r => <RentItem key={r.id} rent={r} tools={tools} userId={userId} onCancel={onCancel} />)}</div>;
    }

    return (
        <div style={{ background: '#fff', padding: 28, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2>Minhas Reservas</h2>
            <p style={{ color: '#6b7280', fontSize: 14, marginTop: 8 }}>
                Gerencie aqui as suas reservas.
            </p>
            <div style={{ marginTop: 12 }}>{content}</div>
        </div>
    );
};

interface PendingItemProps {
    rent: Rent;
    tools: Map<number, Tool>;
    onApprove: (rentId: number) => void;
    onReject: (rentId: number) => void;
}

const PendingItem: React.FC<PendingItemProps> = ({ rent, tools, onApprove, onReject }) => {
    const tool = tools.get(rent.toolId);
    const toolDisplay = tool ? `${tool.name} (#${tool.id})` : `Ferramenta #${rent.toolId}`;

    return (
        <div key={rent.id} style={{ border: '2px solid #fbbf24', borderRadius: 8, padding: 16, background: '#fffbeb' }}>
            <div>
                <h3 style={{ margin: '0 0 8px 0' }}>Reserva #{rent.id} - {toolDisplay}</h3>
                <p style={{ margin: '4px 0', fontSize: 14, color: '#666' }}>👤 Utilizador ID: {rent.userId}</p>
                <p style={{ margin: '4px 0', fontSize: 14, color: '#666' }}>Período: {rent.startDate} → {rent.endDate}</p>
                <p style={{ margin: '4px 0', fontSize: 14, color: '#666' }}>🔖 ID Reserva: #{rent.id}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={() => onApprove(rent.id)} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#22c55e', color: '#fff' }}>Aprovar</button>
                <button onClick={() => onReject(rent.id)} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#ef4444', color: '#fff' }}>Rejeitar</button>
            </div>
        </div>
    );
};

interface PendingViewProps {
    pendingRents: Rent[];
    tools: Map<number, Tool>;
    loadingRents: boolean;
    onApprove: (rentId: number) => void;
    onReject: (rentId: number) => void;
}

const PendingView: React.FC<PendingViewProps> = ({ pendingRents, tools, loadingRents, onApprove, onReject }) => {
    let content;

    if (loadingRents) {
        content = <p style={{ color: '#666', marginTop: 20 }}>🔄 A carregar reservas...</p>;
    } else if (pendingRents.length === 0) {
        content = <p style={{ color: '#666', marginTop: 12 }}>Sem reservas pendentes nas suas ferramentas.</p>;
    } else {
        content = <div style={{ display: 'grid', gap: 12 }}>{pendingRents.map(r => <PendingItem key={r.id} rent={r} tools={tools} onApprove={onApprove} onReject={onReject} />)}</div>;
    }

    return (
        <div style={{ background: '#fff', padding: 28, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#1f2937' }}>Reservas Pendentes nas Suas Ferramentas</h2>
            <p style={{ color: '#6b7280', fontSize: 14, marginTop: 8 }}>
                Aprove ou rejeite reservas feitas para as suas ferramentas.
            </p>
            <div style={{ marginTop: 12 }}>{content}</div>
        </div>
    );
};

interface ToolItemProps {
    tool: Tool;
    onUpdateStatus: (toolId: number, newStatus: string) => void;
}

const ToolItem: React.FC<ToolItemProps> = ({ tool, onUpdateStatus }) => {
    const statusInfo = getToolStatusInfo(tool.status);
    const [isChanging, setIsChanging] = useState(false);

    const availableStatuses = ['AVAILABLE', 'UNDER_MAINTENANCE', 'INACTIVE'];
    const canChange = tool.status !== 'RENTED';

    const handleStatusChange = async (newStatus: string) => {
        if (!canChange) {
            alert('⚠️ Não pode alterar o status enquanto a ferramenta está alugada');
            return;
        }

        const confirmChange = globalThis.confirm(
            `Tem certeza que deseja alterar o status para ${getToolStatusInfo(newStatus).label}?`
        );

        if (!confirmChange) return;

        setIsChanging(true);
        await onUpdateStatus(tool.id, newStatus);
        setIsChanging(false);
    };

    return (
        <div style={{ border: '1px solid #e5e5e5', borderRadius: 8, padding: 16, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16 }}>
                <div>
                    <div style={{ fontWeight: 700 }}>{tool.name}</div>
                    <div style={{ color: '#6b7280', fontSize: 13 }}>{statusInfo.label}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {availableStatuses.map(s => (
                        <button key={s} onClick={() => handleStatusChange(s)} disabled={isChanging} style={{ padding: '6px 10px', borderRadius: 6 }}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

interface MyToolsViewProps {
    myTools: Tool[];
    loading: boolean;
    onUpdateStatus: (toolId: number, newStatus: string) => void;
}

const MyToolsView: React.FC<MyToolsViewProps> = ({ myTools, loading, onUpdateStatus }) => {
    let content;

    if (loading) {
        content = <p>A carregar ferramentas...</p>;
    } else if (myTools.length === 0) {
        content = <p>Não tem anúncios activos.</p>;
    } else {
        content = <div style={{ display: 'grid', gap: 12 }}>{myTools.map(t => <ToolItem key={t.id} tool={t} onUpdateStatus={onUpdateStatus} />)}</div>;
    }

    return (
        <div style={{ background: '#fff', padding: 28, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2>Minhas Ferramentas</h2>
            <p style={{ color: '#6b7280', fontSize: 14, marginTop: 8 }}>
                Gerencie o estado das suas ferramentas.
            </p>
            <div style={{ marginTop: 12 }}>{content}</div>
        </div>
    );
};

export default function UserDetailsPage(): React.ReactElement {
    const navigate = useNavigate();
    const [user, setUser] = useState<User>(null);
    const [loading, setLoading] = useState(true);
    const [myRents, setMyRents] = useState<Rent[]>([]);
    const [pendingRents, setPendingRents] = useState<Rent[]>([]);
    const [myTools, setMyTools] = useState<Tool[]>([]);
    const [tools, setTools] = useState<Map<number, Tool>>(new Map());
    const [loadingRents, setLoadingRents] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>('profile');

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

            let allRents: Rent[] = [];
            let allTools: Tool[] = [];

            try {
                if (rentsResponse.ok) {
                    allRents = await rentsResponse.json();
                }
            } catch (e) {
                safeError('failed parse rents', e);
            }

            try {
                if (toolsResponse.ok) {
                    allTools = await toolsResponse.json();
                }
            } catch (e) {
                safeError('failed parse tools', e);
            }

            const toolsMap = new Map(allTools.map(t => [t.id, t]));
            setTools(toolsMap);

            setMyRents(allRents.filter(r => r.userId === userId));

            const myToolIds = new Set(allTools.filter(t => t.ownerId === userId).map(t => t.id));
            setPendingRents(allRents.filter(r => myToolIds.has(r.toolId) && r.status === 'PENDING'));

            setMyTools(allTools.filter(t => t.ownerId === userId));
        } catch (error) {
            safeError('Failed to load rents:', error);
        } finally {
            setLoadingRents(false);
        }
    }, []);

    const loadUserAndRents = useCallback(async () => {
        setLoading(true);
        try {
            const raw = localStorage.getItem('user');
            let parsed: User = raw ? JSON.parse(raw) : null;
            const token = localStorage.getItem('jwt');

            if (token && (!parsed?.email)) {
                try {
                    const res = await fetch(apiUrl('/api/auth/me'), { headers: { Authorization: `Bearer ${token}` } });
                    if (res.ok) {
                        const data = await res.json();
                        parsed = { id: data.id, username: data.username, email: data.email, role: data.role };
                        localStorage.setItem('user', JSON.stringify(parsed));
                    }
                } catch (e) {
                    safeError('failed to refresh user', e);
                }
            }

            setUser(parsed);
            if (parsed?.id) {
                await loadRents(Number(parsed.id));
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [loadRents]);

    useEffect(() => {
        loadUserAndRents();
    }, [loadUserAndRents]);

    const performPutAction = useCallback(async (url: string, successMsg: string, refreshOwnerId?: number) => {
        const token = localStorage.getItem('jwt');
        if (!token) return;

        try {
            const response = await fetch(url, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
            if (response.ok) {
                alert(successMsg);
                if (refreshOwnerId) await loadRents(refreshOwnerId);
            } else {
                const txt = await response.text().catch(() => response.statusText);
                alert(txt || 'Erro na ação');
            }
        } catch (error) {
            safeError('Action failed:', error);
            alert('Erro na ação');
        }
    }, [loadRents]);

    const handleApprove = useCallback((rentId: number) => {
        if (!user?.id) return;
        const url = apiUrl(`/api/rents/${rentId}/approve?ownerId=${user.id}`);
        performPutAction(url, '✅ Reserva aprovada! A ferramenta foi marcada como ALUGADA.', user.id);
    }, [user, performPutAction]);

    const handleReject = useCallback((rentId: number) => {
        if (!user?.id) return;
        const reason = globalThis.prompt('Motivo da rejeição (opcional):') ?? '';
        const messageParam = reason ? `&message=${encodeURIComponent(reason)}` : '';
        const url = apiUrl(`/api/rents/${rentId}/reject?ownerId=${user.id}${messageParam}`);
        performPutAction(url, 'Reserva rejeitada', user.id);
    }, [user, performPutAction]);

    const handleCancel = useCallback((rentId: number) => {
        if (!user?.id) return;

        const confirmCancel = globalThis.confirm(
            'Tem certeza que deseja cancelar esta reserva?\n\nEsta ação não pode ser desfeita.'
        );

        if (!confirmCancel) return;

        const url = apiUrl(`/api/rents/${rentId}/cancel?userId=${user.id}`);
        performPutAction(url, 'Reserva cancelada com sucesso!', user.id);
    }, [user, performPutAction]);

    const handleUpdateToolStatus = useCallback(async (toolId: number, newStatus: string) => {
        const token = localStorage.getItem('jwt');
        if (!token || !user?.id) return;

        try {
            const response = await fetch(apiUrl(`/api/tools/${toolId}/status`), {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, ownerId: user.id })
            });

            if (response.ok) {
                alert('Status atualizado');
                await loadRents(user.id);
            } else {
                const txt = await response.text().catch(() => response.statusText);
                alert(txt || 'Erro ao atualizar status');
            }
        } catch (error) {
            safeError('Failed to update tool status:', error);
            alert('Erro ao atualizar status da ferramenta');
        }
    }, [user, loadRents]);

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

    return (
        <div style={styles.root}>
            <div style={styles.overlay} />
            <div style={styles.content}>
                <div style={styles.container}>
                    {/* Header incluído aqui */}
                    <Header onBack={() => navigate('/')} onLogout={handleLogout} />

                    <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>
                        <Tabs
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                            myRentsCount={myRents.length}
                            pendingRentsCount={pendingRents.length}
                            myToolsCount={myTools.length}
                        />

                        <div style={{ display: 'grid', gap: 12 }}>
                            {activeTab === 'profile' && <ProfileView user={user} />}
                            {activeTab === 'myRents' && (
                                <MyRentsView
                                    myRents={myRents}
                                    tools={tools}
                                    loadingRents={loadingRents}
                                    userId={user.id}
                                    onCancel={handleCancel}
                                />
                            )}
                            {activeTab === 'pending' && (
                                <PendingView
                                    pendingRents={pendingRents}
                                    tools={tools}
                                    loadingRents={loadingRents}
                                    onApprove={handleApprove}
                                    onReject={handleReject}
                                />
                            )}
                            {activeTab === 'myTools' && (
                                <MyToolsView
                                    myTools={myTools}
                                    loading={loadingRents}
                                    onUpdateStatus={handleUpdateToolStatus}
                                />
                            )}
                        </div>
                    </main>

                    <footer style={styles.footer}>
                        © {new Date().getFullYear()} Crafting Stable — Aluguer de ferramentas.
                    </footer>
                </div>
            </div>
        </div>
    );
}
