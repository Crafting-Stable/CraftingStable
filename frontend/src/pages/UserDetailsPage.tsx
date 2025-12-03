import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import craftingstable from '../assets/craftingstable.png';

type User = { username: string; email?: string; role?: string } | null;

export default function UserDetailsPage(): React.ReactElement {
    const navigate = useNavigate();
    const [user, setUser] = useState<User>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const raw = localStorage.getItem('user');
                let parsed: User = raw ? JSON.parse(raw) : null;
                const token = localStorage.getItem('jwt');

                // Se não houver email (ou outros campos) e tivermos token, pedimos o perfil ao servidor
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
                                    role: data.role ?? parsed?.role
                                };
                                // Guardamos versão completa no localStorage para próximas visitas
                                localStorage.setItem('user', JSON.stringify(parsed));
                            }
                        } else if (res.status === 401) {
                            // token inválido / expirado
                            localStorage.removeItem('jwt');
                            localStorage.removeItem('user');
                            parsed = null;
                        }
                    } catch {
                        // falha de rede -> manter o que já temos (se houver)
                    }
                }

                setUser(parsed);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        load();
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
                <h2>Não autenticado</h2>
                <p>Não foi possível encontrar dados de utilizador.</p>
                <button onClick={() => navigate('/loginPage')}>Ir para Login</button>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24 }}>
            <header style={{ width: '100%', maxWidth: 1100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img src={craftingstable} alt="logo" style={{ width: 48 }} />
                    <div style={{ fontWeight: 700 }}>CraftingStable</div>
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link to="/user" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 18, background: '#fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                            {user.username ? user.username[0].toUpperCase() : 'U'}
                        </div>
                    </Link>
                    <button onClick={() => navigate('/')} style={{ marginRight: 12 }}>Voltar</button>
                    <button onClick={handleLogout} style={{ background: '#f8b749', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Sair</button>
                </div>
            </header>

            <main style={{ width: '100%', maxWidth: 800, background: '#9f9a22', padding: 28, borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }}>
                <h2>Perfil</h2>

                <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginTop: 12 }}>
                    <div style={{ width: 72, height: 72, borderRadius: 36, background: '#fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        {user.username ? user.username[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{user.username}</div>
                        <div style={{ color: '#1958dc' }}>{user.role ?? 'Utilizador'}</div>
                        <div style={{ color: '#666d7e', marginTop: 6 }}>{user.email ?? 'Email não disponível'}</div>
                    </div>
                </div>

                <section style={{ marginTop: 20 }}>
                    <h3>Informação</h3>
                    <p>Aqui poderá consultar e editar a sua informação pessoal (simulado).</p>

                    <div style={{ marginTop: 12 }}>
                        <button onClick={() => alert('Editar perfil (simulado)')} style={{ marginRight: 8 }}>Editar</button>
                        <button onClick={handleLogout} style={{ background: '#f8b749', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Sair</button>
                    </div>
                </section>
            </main>
        </div>
    );
}
