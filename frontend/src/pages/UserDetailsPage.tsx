import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import craftingstable from '../assets/craftingstable.png';
import { fetchWikiInfo } from '../utils/wiki';

type User = { username: string; email?: string; role?: string; avatar?: string } | null;

export default function UserDetailsPage(): React.ReactElement {
    const navigate = useNavigate();
    const [user, setUser] = useState<User>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            setLoading(true);
            try {
                const raw = localStorage.getItem('user');
                let parsed: User = raw ? JSON.parse(raw) : null;
                const token = localStorage.getItem('jwt');

                if (token && (!parsed || !parsed.email)) {
                    try {
                        const res = await fetch('/api/auth/me', {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        if (res.ok) {
                            const data = await res.json().catch(() => null);
                            if (data) {
                                parsed = {
                                    username: data.username ?? parsed?.username ?? '',
                                    email: data.email ?? parsed?.email,
                                    role: data.role ?? parsed?.role,
                                    avatar: parsed?.avatar
                                };
                                localStorage.setItem('user', JSON.stringify(parsed));
                            }
                        } else if (res.status === 401) {
                            localStorage.removeItem('jwt');
                            localStorage.removeItem('user');
                            parsed = null;
                        }
                    } catch {
                        // mantém o que já existe em localStorage
                    }
                }

                // tenta enriquecer com imagem do Wikipedia/Wikidata se não existir avatar
                if (parsed && parsed.username && !parsed.avatar) {
                    try {
                        const wiki = await fetchWikiInfo(parsed.username, 200);
                        if (wiki?.thumbnail) {
                            parsed = { ...parsed, avatar: wiki.thumbnail };
                            localStorage.setItem('user', JSON.stringify(parsed));
                        }
                    } catch {
                        // ignora erros do wiki
                    }
                }

                if (mounted) setUser(parsed);
            } catch {
                if (mounted) setUser(null);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => { mounted = false; };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
        navigate('/');
    };

    if (loading) {
        return <div style={{ padding: 24 }}>A carregar...</div>;
    }

    if (!user) {
        return (
            <div style={{ padding: 24 }}>
                <div style={{ marginBottom: 12 }}>Utilizador não autenticado.</div>
                <Link to="/" style={{ color: "#f8b749", fontWeight: 700 }}>Voltar</Link>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24 }}>
            <div style={{ width: 680, maxWidth: '100%', background: 'rgba(0,0,0,0.6)', padding: 20, borderRadius: 10, color: '#fff' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <img
                        src={user.avatar ?? craftingstable}
                        alt={user.username}
                        style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, background: '#222' }}
                    />
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 800 }}>{user.username}</div>
                        <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.85)' }}>{user.email ?? '—'}</div>
                        <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.7)' }}>{user.role ?? 'Utilizador'}</div>
                    </div>

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        <button onClick={handleLogout} style={{ background: '#f8b749', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>
                            Sair
                        </button>
                        <Link to="/catalog" style={{ color: '#f8b749', alignSelf: 'center', fontWeight: 700 }}>Catálogo</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
