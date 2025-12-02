import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import logoImg from '../assets/craftingstable.png';
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
    const [login, setLogin] = useState<LoginForm>({ email: '', password: '', remember: false });
    const [reg, setReg] = useState<RegisterForm>({ name: '', email: '', password: '', passwordConfirm: '' });
    const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
    const [regErrors, setRegErrors] = useState<Record<string, string>>({});
    const [showLoginPw, setShowLoginPw] = useState(false);
    const [showRegPw, setShowRegPw] = useState(false);

    const emailValid = (e: string) => /\S+@\S+\.\S+/.test(e);

    const handleLoginSubmit = (ev?: React.FormEvent) => {
        ev?.preventDefault();
        const errs: Record<string, string> = {};
        if (!login.email) errs.email = 'Email obrigatório';
        else if (!emailValid(login.email)) errs.email = 'Email inválido';
        if (!login.password) errs.password = 'Password obrigatória';
        setLoginErrors(errs);
        if (Object.keys(errs).length === 0) {
            console.log('Login', login);
            alert('Login submetido (simulado)');
            setLogin({ ...login, password: '' });
        }
    };

    const handleRegisterSubmit = (ev?: React.FormEvent) => {
        ev?.preventDefault();
        const errs: Record<string, string> = {};
        if (!reg.name) errs.name = 'Nome obrigatório';
        if (!reg.email) errs.email = 'Email obrigatório';
        else if (!emailValid(reg.email)) errs.email = 'Email inválido';
        if (!reg.password) errs.password = 'Password obrigatória';
        else if (reg.password.length < 6) errs.password = 'Mínimo 6 caracteres';
        if (reg.password !== reg.passwordConfirm) errs.passwordConfirm = 'Passwords não coincidem';
        setRegErrors(errs);
        if (Object.keys(errs).length === 0) {
            console.log('Registo', reg);
            alert('Registo submetido (simulado)');
            setReg({ name: '', email: '', password: '', passwordConfirm: '' });
        }
    };

    return (
        <div style={styles.root}>
            <div style={styles.overlay} />
            <div style={styles.content}>
                <header style={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }}>
                            <img src={logoImg} alt="Crafting Stable logo" style={styles.logoImage} />
                            <div style={styles.logoText}>CraftingStable</div>
                        </Link>

                        <nav style={styles.nav}>
                            <Link to="/catalog" style={{ color: 'inherit', textDecoration: 'none' }}>Catálogo</Link>
                            <Link to="/about" style={{ color: 'inherit', textDecoration: 'none' }}>Sobre</Link>
                        </nav>
                    </div>

                    <div style={styles.headerRight}>
                        <Link to="/loginPage" style={styles.loginButton}>Iniciar sessão</Link>
                    </div>
                </header>

                <div style={styles.container}>
                    <h1 style={styles.title}>Entrar ou Registar</h1>

                    <div className="side-by-side" aria-live="polite">
                        <section className="card" style={{ flex: 1 }}>
                            <div className="brand">
                                <span className="brand-logo" aria-hidden />
                                <div>
                                    <strong>Já tem conta?</strong>
                                    <div className="muted">Faça login para continuar com a compra.</div>
                                </div>
                            </div>

                            <form onSubmit={handleLoginSubmit} aria-label="Formulário de login">
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
                                            aria-pressed={showLoginPw}
                                        >
                                            {showLoginPw ? 'Ocultar' : 'Mostrar'}
                                        </button>
                                    </div>
                                    {loginErrors.password && <div className="error">{loginErrors.password}</div>}
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

                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button type="submit" className="btn">Entrar</button>
                                    <button type="button" className="btn secondary" onClick={() => alert('Login com Google (simulado)')}>Google</button>
                                    <button type="button" className="btn secondary" onClick={() => alert('Login com Facebook (simulado)')}>Facebook</button>
                                </div>
                            </form>
                        </section>

                        <section className="card" style={{ flex: 1 }}>
                            <div className="brand">
                                <div style={{ width: 44 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 8, background: '#fde68a' }} />
                                </div>
                                <div>
                                    <strong>Primeira vez?</strong>
                                    <div className="muted">Crie a sua conta para um checkout mais rápido.</div>
                                </div>
                            </div>

                            <form onSubmit={handleRegisterSubmit} aria-label="Formulário de registo">
                                <div style={{ marginBottom: 12 }}>
                                    <label className="muted">Nome</label>
                                    <input value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} />
                                    {regErrors.name && <div className="error">{regErrors.name}</div>}
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <label className="muted">Email</label>
                                    <input type="email" value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} />
                                    {regErrors.email && <div className="error">{regErrors.email}</div>}
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <label className="muted">Password</label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input type={showRegPw ? 'text' : 'password'} value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} />
                                        <button type="button" className="btn secondary" onClick={() => setShowRegPw((s) => !s)} aria-pressed={showRegPw}>
                                            {showRegPw ? 'Ocultar' : 'Mostrar'}
                                        </button>
                                    </div>
                                    {regErrors.password && <div className="error">{regErrors.password}</div>}
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <label className="muted">Confirmar Password</label>
                                    <input type={showRegPw ? 'text' : 'password'} value={reg.passwordConfirm} onChange={(e) => setReg({ ...reg, passwordConfirm: e.target.value })} />
                                    {regErrors.passwordConfirm && <div className="error">{regErrors.passwordConfirm}</div>}
                                </div>

                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button type="submit" className="btn">Criar conta</button>
                                    <button type="button" className="btn secondary" onClick={() => alert('Continuar como convidado (simulado)')}>Continuar como convidado</button>
                                </div>
                            </form>
                        </section>
                    </div>

                    <div style={{ marginTop: 18, textAlign: 'center', color: '#6b7280' }}>
                        <small>Ao prosseguir aceita os termos e a política de privacidade.</small>
                    </div>
                </div>

                <footer style={styles.footer}>
                    © {new Date().getFullYear()} Crafting Stable — Aluguer de ferramentas. Políticas | Contato
                </footer>
            </div>

            <style>
                {`
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
          .input-row { display:flex; gap:8px; }
          .error { color:#d32f2f; font-size:13px; margin-top:6px; }
          .muted { color:#6b7280; font-size:14px; }
        `}
            </style>
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
        color: '#111'
    },
    overlay: {
        position: 'absolute',
        inset: 0,
        background: 'rgba(255,255,255,0.92)'
    },
    content: {
        position: 'relative',
        zIndex: 2,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
    },
    header: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', boxSizing: 'border-box', borderBottom: '1px solid rgba(0,0,0,0.04)', background: 'transparent', color: '#111' },
    headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
    container: {
        width: '100%',
        maxWidth: 1150,
        marginTop: 28,
        padding: 32,
        boxSizing: 'border-box'
    },
    logoText: { fontWeight: 700, fontSize: 20, color: '#198515' },
    logoImage: { width: 48, height: 'auto', marginRight: 12 },
    nav: { display: 'flex', gap: 12, color: '#111', fontFamily: 'Inter, Arial, sans-serif' },
    loginButton: { padding: '8px 14px', borderRadius: 8, background: '#f8b749', color: '#222', textDecoration: 'none', fontWeight: 600, border: 'none', cursor: 'pointer' },
    title: {
        margin: '0 0 18px 0',
        fontSize: 22
    },
    footer: { width: '100%', borderTop: '1px solid rgba(0,0,0,0.04)', padding: '18px 0', color: '#6b7280', textAlign: 'center', fontSize: 14, boxSizing: 'border-box', background: 'transparent', marginTop: 'auto' },
};