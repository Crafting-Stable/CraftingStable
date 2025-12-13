import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

import bgImg from '../assets/rust.jpg';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    passwordConfirm: string;
};

export default function LoginPage(): React.ReactElement {
    const navigate = useNavigate();
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [login, setLogin] = useState<LoginForm>({ email: '', password: '', remember: false });
    const [reg, setReg] = useState<RegisterForm>({ name: '', email: '', password: '', passwordConfirm: '' });
    const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
    const [regErrors, setRegErrors] = useState<Record<string, string>>({});
    const [showLoginPw, setShowLoginPw] = useState(false);
    const [showRegPw, setShowRegPw] = useState(false);

    const emailValid = (e: string) => /\S+@\S+\.\S+/.test(e);

    const handleLoginSubmit = async (ev?: React.FormEvent) => {
        ev?.preventDefault();
        const errs: Record<string, string> = {};

        if (!login.email) errs.email = 'Email obrigatório';
        else if (!emailValid(login.email)) errs.email = 'Email inválido';

        if (!login.password) errs.password = 'Password obrigatória';

        setLoginErrors(errs);
        if (Object.keys(errs).length > 0) return;

        console.log('🔐 Attempting login with email:', login.email);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: login.email, password: login.password })
            });

            console.log('📥 Login response status:', res.status);

            const data: any = await res.json().catch(() => ({}));
            console.log('📦 Login response data:', data);

            if (!res.ok) {
                if (data.errors) setLoginErrors(data.errors);
                else if (data.message) setLoginErrors({ general: data.message });
                else setLoginErrors({ general: 'Erro no login' });
                return;
            }

            if (data.token) {
                console.log('🎫 JWT Token received:', data.token.substring(0, 30) + '...');

                // 🔥 IMPORTANTE: Guarda o ID do utilizador
                const userId = data.id || data.user_id || data.userId;
                console.log('🆔 User ID from response:', userId);

                localStorage.setItem('jwt', data.token);

                const userToStore = {
                    username: data.username || data.name,
                    email: data.email || login.email,
                    role: data.role,
                    id: userId  // ✅ GUARDA O ID
                };

                console.log('💾 Saving user to localStorage:', userToStore);
                localStorage.setItem('user', JSON.stringify(userToStore));

                // Verifica se guardou corretamente
                const savedJwt = localStorage.getItem('jwt');
                const savedUser = localStorage.getItem('user');
                console.log('✅ JWT saved:', savedJwt ? 'YES' : 'NO');
                console.log('✅ User saved:', savedUser);

                window.dispatchEvent(new Event('authChanged'));

                setLogin({ ...login, password: '' });

                if (data.role === 'ADMIN') {
                    console.log('🚀 Redirecting ADMIN to /admin');
                    navigate('/admin');
                } else {
                    console.log('🚀 Redirecting CUSTOMER to /catalog');
                    navigate('/catalog');
                }
            } else {
                console.error('❌ No token in response');
                setLoginErrors({ general: 'Resposta inválida do servidor' });
            }
        } catch (e) {
            console.error('💥 Login exception:', e);
            setLoginErrors({ general: 'Erro de rede' });
        }
    };

    const handleRegisterSubmit = async (ev?: React.FormEvent) => {
        ev?.preventDefault();
        const errs: Record<string, string> = {};
        if (!reg.name) errs.name = 'Nome obrigatório';
        if (!reg.email) errs.email = 'Email obrigatório';
        else if (!emailValid(reg.email)) errs.email = 'Email inválido';
        if (!reg.password) errs.password = 'Password obrigatória';
        else if (reg.password.length < 6) errs.password = 'Mínimo 6 caracteres';
        if (reg.password !== reg.passwordConfirm) errs.passwordConfirm = 'Passwords não coincidem';
        setRegErrors(errs);
        if (Object.keys(errs).length > 0) return;

        console.log('📝 Attempting registration with email:', reg.email);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: reg.name,
                    email: reg.email,
                    password: reg.password,
                    passwordConfirm: reg.passwordConfirm,
                    role: 'CUSTOMER'
                })
            });

            console.log('📥 Register response status:', res.status);

            const data: any = await res.json().catch(() => ({}));
            console.log('📦 Register response data:', data);

            if (!res.ok) {
                if (data.errors) setRegErrors(data.errors);
                else if (data.message) setRegErrors({ general: data.message });
                else setRegErrors({ general: 'Erro no registo' });
                return;
            }

            console.log('✅ Registration successful');
            alert('Registo efetuado. Por favor inicie sessão.');
            setReg({ name: '', email: '', password: '', passwordConfirm: '' });
            navigate('/loginPage');
        } catch (e) {
            console.error('💥 Register exception:', e);
            setRegErrors({ general: 'Erro de rede' });
        }
    };

    return (
        <div style={styles.root}>
            <div style={styles.overlay} />
            <div style={styles.content}>
                <Header />

                <div style={styles.container}>
                    <h1 style={styles.title}>Entrar</h1>

                    <div style={{ display: 'flex', justifyContent: 'center' }} aria-live="polite">
                        <section className="card" style={{ maxWidth: 420, width: '100%' }}>
                            <div className="brand">
                                <span className="brand-logo" aria-hidden />
                                <div>
                                    <strong>Já tem conta?</strong>
                                    <div className="muted">Faça login para continuar.</div>
                                </div>
                            </div>

                            <form onSubmit={handleLoginSubmit}>
                                <div style={{ marginBottom: 12 }}>
                                    <label className="muted">Email</label>
                                    <input
                                        type="email"
                                        value={login.email}
                                        onChange={(e) => setLogin({ ...login, email: e.target.value })}
                                        aria-invalid={!!loginErrors.email}
                                    />
                                    {loginErrors.email && <div className="error">{loginErrors.email}</div>}
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <label className="muted">Password</label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input
                                            type={showLoginPw ? 'text' : 'password'}
                                            value={login.password}
                                            onChange={(e) => setLogin({ ...login, password: e.target.value })}
                                            aria-invalid={!!loginErrors.password}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowLoginPw((s) => !s)}
                                            className="btn secondary"
                                        >
                                            {showLoginPw ? 'Ocultar' : 'Mostrar'}
                                        </button>
                                    </div>
                                    {loginErrors.password && <div className="error">{loginErrors.password}</div>}
                                    {loginErrors.general && <div className="error">{loginErrors.general}</div>}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <input
                                            type="checkbox"
                                            checked={login.remember}
                                            onChange={(e) => setLogin({ ...login, remember: e.target.checked })}
                                        />
                                        <span className="muted">Lembrar-me</span>
                                    </label>

                                    <button type="button" className="btn secondary" onClick={() => alert('Recuperação de password (simulado)')}>
                                        Esqueceu a password?
                                    </button>
                                </div>

                                <button type="submit" className="btn">Entrar</button>
                            </form>
                        </section>
                    </div>

                    <div style={{ marginTop: 18, textAlign: 'center' }}>
                        <span className="muted">Primeira vez?</span>
                        <button className="btn secondary" style={{ marginLeft: 10 }} onClick={() => setShowRegisterForm(true)}>Criar conta</button>
                    </div>

                    <div style={{ marginTop: 18, textAlign: 'center', color: '#6b7280' }}>
                        <small>Ao prosseguir aceita os termos e a política de privacidade.</small>
                    </div>
                </div>

                <footer style={styles.footer}>
                    © {new Date().getFullYear()} Crafting Stable — Aluguer de ferramentas.
                </footer>
            </div>

            {showRegisterForm && (
                <button
                    className="modal-backdrop"
                    aria-label="Fechar formulário de registo"
                    onClick={() => setShowRegisterForm(false)}
                    style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
                >
                    <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                        <section className="card" style={{ maxWidth: 540, width: '100%', maxHeight: '80vh', overflow: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <div className="brand">
                                    <div style={{ width: 44 }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 8, background: '#fde68a' }} />
                                    </div>
                                    <div>
                                        <strong>Crie a sua conta</strong>
                                        <div className="muted">Rápido e fácil.</div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            )}

            <style>{`
              @media (max-width: 780px) {
                .side-by-side { flex-direction: column; padding: 16px; }
                .card { width: 100%; margin: 8px 0; }
              }
              .side-by-side { display: flex; gap: 24px; align-items: stretch; }
              .card { background: #fff; border-radius: 8px; box-shadow: 0 6px 18px rgba(0,0,0,0.06); padding: 28px; width: 100%; max-width: 520px; }
              .brand { display:flex; gap:12px; align-items:center; margin-bottom: 18px; }
              .brand-logo { width:44px; height:44px; background:linear-gradient(135deg,#1f8bf5,#4bd3a8); border-radius:8px; display:inline-block; }
              .btn { background:#1f8bf5; color:#fff; border:0; padding:10px 14px; border-radius:6px; cursor:pointer; }
              .btn.secondary { background:#f3f4f6; color:#111; border:1px solid #e5e7eb; }
              input { width:100%; padding:10px 12px; border:1px solid #e5e7eb; border-radius:6px; }
              .error { color:#d32f2f; font-size:13px; margin-top:6px; }
              .muted { color:#6b7280; font-size:14px; }
              .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; z-index: 9999; }
              .modal { padding: 18px; max-width: 96vw; box-sizing: border-box; }
              .modal .card { box-shadow: 0 10px 30px rgba(0,0,0,0.18); }
              .modal .card::-webkit-scrollbar { height: 8px; }
              .modal .card { max-height: 80vh; overflow: auto; }
            `}</style>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    root: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        backgroundImage: `url(${bgImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        color: '#f1991e',
        filter: 'contrast(110%)'
    },
    overlay: {
        position: 'absolute',
        inset: 0,
        background: 'rgba(255,255,255,0.6)'
    },
    content: {
        position: 'relative',
        zIndex: 2,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
    },
    container: {
        width: '100%',
        maxWidth: 1980,
        marginTop: 28,
        padding: 32,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh'
    },
    title: {
        margin: '0 0 18px 0',
        fontSize: 22
    },
    footer: {
        width: '100%',
        borderTop: '1px solid rgba(0,0,0,0.04)',
        padding: '18px 0',
        color: '#6b7280',
        textAlign: 'center',
        fontSize: 14,
        background: 'transparent',
        marginTop: 'auto'
    }
};