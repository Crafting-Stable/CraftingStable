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
    const [login, setLogin] = useState<LoginForm>({ email: '', password: '', remember: false });
    const [reg, setReg] = useState<RegisterForm>({ name: '', email: '', password: '', passwordConfirm: '' });
    const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
    const [regErrors, setRegErrors] = useState<Record<string, string>>({});
    const [showLoginPw, setShowLoginPw] = useState(false);
    const [showRegPw, setShowRegPw] = useState(false);

    const emailValid = (e: string) => /\S+@\S+\.\S+/.test(e);

    // Helpers
    const safeJson = async (res: Response) => {
        return await res.json().catch(() => ({}));
    };

    const extractServerErrors = (data: any, defaultMsg: string) => {
        if (data && typeof data === 'object') {
            if (data.errors) return data.errors;
            if (data.message) return { general: data.message };
        }
        return { general: defaultMsg };
    };

    const saveAuthData = (data: any, fallbackEmail: string) => {
        const userId = data.id || data.user_id || data.userId;
        try {
            globalThis.localStorage?.setItem('jwt', data.token);
        } catch (e) {
            // localStorage não disponível — silencioso
        }

        const userToStore = {
            username: data.username || data.name,
            email: data.email || fallbackEmail,
            role: data.role,
            id: userId
        };

        try {
            globalThis.localStorage?.setItem('user', JSON.stringify(userToStore));
        } catch (e) {
            // falha ao gravar user — silencioso
        }
    };

    const handleLoginSubmit = async (ev?: React.FormEvent) => {
        ev?.preventDefault();
        const errs: Record<string, string> = {};

        if (!login.email) errs.email = 'Email obrigatório';
        else if (!emailValid(login.email)) errs.email = 'Email inválido';
        if (!login.password) errs.password = 'Password obrigatória';

        setLoginErrors(errs);
        if (Object.keys(errs).length > 0) return;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: login.email, password: login.password })
            });

            const data: any = await safeJson(res);

            if (!res.ok) {
                setLoginErrors(extractServerErrors(data, 'Erro no login'));
                return;
            }

            if (!data.token) {
                setLoginErrors({ general: 'Resposta inválida do servidor' });
                return;
            }

            saveAuthData(data, login.email);

            try {
                globalThis.dispatchEvent(new Event('authChanged'));
            } catch (e) {
                // dispatchEvent não disponível — silencioso
            }

            setLogin({ ...login, password: '' });

            const route = data.role === 'ADMIN' ? '/admin' : '/catalog';
            navigate(route);
        } catch (e) {
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

            const data: any = await safeJson(res);

            if (!res.ok) {
                setRegErrors(extractServerErrors(data, 'Erro no registo'));
                return;
            }

            globalThis.alert?.('Registo efetuado. Por favor inicie sessão.');
            setReg({ name: '', email: '', password: '', passwordConfirm: '' });
            navigate('/loginPage');
        } catch (e) {
            setRegErrors({ general: 'Erro de rede' });
        }
    };

    return (
        <div style={styles.root}>
            <div style={styles.overlay} />
            <div style={styles.content}>
                <Header />

                <div style={styles.container}>
                    <h1 style={styles.title}>Entrar ou Registar</h1>

                    <div className="side-by-side" aria-live="polite">
                        <section className="card" style={{ flex: 1 }}>
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
                                </div>

                                <button type="submit" className="btn">Entrar</button>
                            </form>
                        </section>

                        <section className="card" style={{ flex: 1 }}>
                            <div className="brand">
                                <div style={{ width: 44 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 8, background: '#fde68a' }} />
                                </div>
                                <div>
                                    <strong>Primeira vez?</strong>
                                    <div className="muted">Crie a sua conta.</div>
                                </div>
                            </div>

                            <form onSubmit={handleRegisterSubmit}>
                                <div style={{ marginBottom: 12 }}>
                                    <label className="muted">Nome</label>
                                    <input
                                        value={reg.name}
                                        onChange={(e) => setReg({ ...reg, name: e.target.value })}
                                    />
                                    {regErrors.name && <div className="error">{regErrors.name}</div>}
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <label className="muted">Email</label>
                                    <input
                                        type="email"
                                        value={reg.email}
                                        onChange={(e) => setReg({ ...reg, email: e.target.value })}
                                    />
                                    {regErrors.email && <div className="error">{regErrors.email}</div>}
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <label className="muted">Password</label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input
                                            type={showRegPw ? 'text' : 'password'}
                                            value={reg.password}
                                            onChange={(e) => setReg({ ...reg, password: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            className="btn secondary"
                                            onClick={() => setShowRegPw((s) => !s)}
                                        >
                                            {showRegPw ? 'Ocultar' : 'Mostrar'}
                                        </button>
                                    </div>
                                    {regErrors.password && <div className="error">{regErrors.password}</div>}
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <label className="muted">Confirmar Password</label>
                                    <input
                                        type={showRegPw ? 'text' : 'password'}
                                        value={reg.passwordConfirm}
                                        onChange={(e) => setReg({ ...reg, passwordConfirm: e.target.value })}
                                    />
                                    {regErrors.passwordConfirm && <div className="error">{regErrors.passwordConfirm}</div>}
                                    {regErrors.general && <div className="error">{regErrors.general}</div>}
                                </div>

                                <button type="submit" className="btn">Criar conta</button>
                            </form>
                        </section>
                    </div>

                    <div style={{ marginTop: 18, textAlign: 'center', color: '#6b7280' }}>
                        <small>Ao prosseguir aceita os termos e a política de privacidade.</small>
                    </div>
                </div>

                <footer style={styles.footer}>
                    © {new Date().getFullYear()} Crafting Stable — Aluguer de ferramentas.
                </footer>
            </div>

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
        maxWidth: 1150,
        marginTop: 28,
        padding: 32,
        boxSizing: 'border-box'
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
