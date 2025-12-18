// language: typescript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

import bgImg from '../assets/rust.jpg';

type LoginForm = {
    email: string;
    password: string;
};

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    confirm: string;
};

const MIN_PASSWORD_LENGTH = 6;
const ERR_NAME_REQUIRED = 'Nome obrigatório';
const ERR_EMAIL_REQUIRED = 'Email obrigatório';
const ERR_EMAIL_INVALID = 'Email inválido';
const ERR_PASSWORD_REQUIRED = 'Password obrigatória';
const ERR_PASSWORD_TOO_SHORT = `Password muito curta (mínimo ${MIN_PASSWORD_LENGTH} caracteres)`;
const ERR_CONFIRM_MISMATCH = 'Passwords não coincidem';
const ERR_NETWORK = 'Erro de rede';
const ERR_LOGIN = 'Erro no login';
const ERR_REGISTER = 'Erro no registo';
const ERR_INVALID_RESPONSE = 'Resposta inválida do servidor';

export default function LoginPage(): React.ReactElement {
    const navigate = useNavigate();
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [login, setLogin] = useState<LoginForm>({ email: '', password: '' });
    const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
    const [showLoginPw, setShowLoginPw] = useState(false);

    const [register, setRegister] = useState<RegisterForm>({ name: '', email: '', password: '', confirm: '' });
    const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});

    const emailValid = (e: string) => /\S+@\S+\.\S+/.test(e);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && showRegisterForm) setShowRegisterForm(false);
        };
        if (showRegisterForm) globalThis.addEventListener('keydown', handleKey);
        return () => globalThis.removeEventListener('keydown', handleKey);
    }, [showRegisterForm]);

    // --- Helpers ---

    const postJson = async (path: string, payload: unknown) => {
        try {
            const res = await fetch(path, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            let data: unknown = {};
            try {
                data = await res.json();
            } catch {
                data = {};
            }
            return { ok: res.ok, status: res.status, data };
        } catch {
            return { ok: false, status: 0, data: ERR_NETWORK };
        }
    };

    const applyApiErrors = (
        data: unknown,
        setErrors: (e: Record<string, string>) => void,
        fallback: string
    ) => {
        if (typeof data === 'object' && data !== null) {
            const d = data as Record<string, unknown>;
            if (d.errors && typeof d.errors === 'object') {
                setErrors(d.errors as Record<string, string>);
                return;
            }
            if (d.message && typeof d.message === 'string') {
                setErrors({ general: d.message });
                return;
            }
        }
        setErrors({ general: fallback });
    };

    const validateLogin = (form: LoginForm) => {
        const errs: Record<string, string> = {};
        if (!form.email) errs.email = ERR_EMAIL_REQUIRED;
        else if (!emailValid(form.email)) errs.email = ERR_EMAIL_INVALID;
        if (!form.password) errs.password = ERR_PASSWORD_REQUIRED;
        return errs;
    };

    const validateRegister = (form: RegisterForm) => {
        const errs: Record<string, string> = {};
        if (!form.name) errs.name = ERR_NAME_REQUIRED;
        if (!form.email) errs.email = ERR_EMAIL_REQUIRED;
        else if (!emailValid(form.email)) errs.email = ERR_EMAIL_INVALID;
        if (!form.password) errs.password = ERR_PASSWORD_REQUIRED;
        else if (form.password.length < MIN_PASSWORD_LENGTH) errs.password = ERR_PASSWORD_TOO_SHORT;
        if (form.password !== form.confirm) errs.confirm = ERR_CONFIRM_MISMATCH;
        return errs;
    };

    const handleLoginSubmit = async (ev?: React.FormEvent) => {
        ev?.preventDefault();
        const errs = validateLogin(login);
        setLoginErrors(errs);
        if (Object.keys(errs).length > 0) return;

        const { ok, status, data } = await postJson('/api/auth/login', {
            email: login.email,
            password: login.password
        });

        if (!ok) {
            if (data === ERR_NETWORK) {
                setLoginErrors({ general: ERR_NETWORK });
                return;
            }

            // Se backend devolver message (ex: "Este utilizador não existe.")
            if (typeof data === 'object' && data !== null && 'message' in data) {
                const msg = (data as { message: string }).message;
                setLoginErrors({ general: msg });
                return;
            }

            // fallback para outros erros
            if (status === 401) {
                setLoginErrors({ general: 'Email ou password incorretos.' });
                return;
            }

            applyApiErrors(data, setLoginErrors, ERR_LOGIN);
            return;
        }

        if (typeof data === 'object' && data !== null) {
            const d = data as Record<string, unknown>;
            const token = typeof d.token === 'string' ? d.token : undefined;
            if (token) {
                const userId = (d.id as string) ?? (d.user_id as string) ?? (d.userId as string);
                localStorage.setItem('jwt', token);
                const userToStore = {
                    username: (d.username as string) || (d.name as string),
                    email: (d.email as string) || login.email,
                    role: d.role as string,
                    id: userId
                };
                localStorage.setItem('user', JSON.stringify(userToStore));
                globalThis.dispatchEvent(new Event('authChanged'));
                setLogin({ ...login, password: '' });

                if (userToStore.role === 'ADMIN') navigate('/admin');
                else navigate('/catalog');
                return;
            }
        }
        setLoginErrors({ general: ERR_INVALID_RESPONSE });
    };

    const handleRegisterSubmit = async (ev?: React.FormEvent) => {
        ev?.preventDefault();
        const errs = validateRegister(register);
        setRegisterErrors(errs);
        if (Object.keys(errs).length > 0) return;

        const payload = {
            name: register.name,
            email: register.email,
            password: register.password,
            passwordConfirm: register.confirm,
            role: 'CUSTOMER'
        };

        const { ok, data } = await postJson('/api/auth/register', payload);
        if (!ok) {
            if (data === ERR_NETWORK) {
                setRegisterErrors({ general: ERR_NETWORK });
            } else {
                applyApiErrors(data, setRegisterErrors, ERR_REGISTER);
            }
            return;
        }

        setShowRegisterForm(false);
        setLogin({ ...login, email: register.email, password: '' });
        setRegister({ name: '', email: '', password: '', confirm: '' });
        globalThis.dispatchEvent(new Event('authChanged'));
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
                                    <label className="muted" htmlFor="login-email">Email</label>
                                    <input
                                        id="login-email"
                                        type="email"
                                        value={login.email}
                                        onChange={(e) => setLogin({ ...login, email: e.target.value })}
                                        aria-invalid={!!loginErrors.email}
                                    />
                                    {loginErrors.email && <div className="error">{loginErrors.email}</div>}
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <label className="muted" htmlFor="login-password">Password</label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input
                                            id="login-password"
                                            type={showLoginPw ? 'text' : 'password'}
                                            value={login.password}
                                            onChange={(e) => setLogin({ ...login, password: e.target.value })}
                                            aria-invalid={!!loginErrors.password}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowLoginPw(!showLoginPw)}
                                            className="btn secondary"
                                            aria-label="Mostrar ou esconder password"
                                            style={{ whiteSpace: 'nowrap' }}
                                        >
                                            {showLoginPw ? 'Esconder' : 'Mostrar'}
                                        </button>
                                    </div>
                                    {loginErrors.password && <div className="error">{loginErrors.password}</div>}
                                    {loginErrors.general && (
                                        <div className="error" style={{ marginTop: 8 }}>
                                            {loginErrors.general}
                                        </div>
                                    )}
                                </div>

                                <button type="submit" className="btn">Entrar</button>
                            </form>
                        </section>
                    </div>

                    <div style={{ marginTop: 18, textAlign: 'center' }}>
                        <span className="muted">Primeira vez?</span>
                        <button
                            className="btn secondary"
                            style={{ marginLeft: 10 }}
                            onClick={() => setShowRegisterForm(true)}
                        >
                            Criar conta
                        </button>
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
                <>
                    <button
                        className="modal-backdrop"
                        aria-label="Fechar formulário de registo"
                        onClick={() => setShowRegisterForm(false)}
                        style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
                    ></button>

                    <dialog
                        className="modal"
                        open
                        aria-modal="true"
                        style={{ zIndex: 10000 }}
                    >
                        <section
                            className="card"
                            style={{ maxWidth: 540, width: '100%', maxHeight: '80vh', overflow: 'auto' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 8
                            }}>
                                <div className="brand">
                                    <div style={{ width: 44 }}>
                                        <div
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 8,
                                                background: '#fde68a'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <strong>Crie a sua conta</strong>
                                        <div className="muted">Rápido e fácil.</div>
                                    </div>
                                </div>

                                <button
                                    className="btn secondary"
                                    onClick={() => setShowRegisterForm(false)}
                                    aria-label="Fechar"
                                >
                                    Fechar
                                </button>
                            </div>

                            <form onSubmit={handleRegisterSubmit}>
                                <div style={{ marginBottom: 12 }}>
                                    <label className="muted" htmlFor="register-name">Nome</label>
                                    <input
                                        id="register-name"
                                        type="text"
                                        value={register.name}
                                        onChange={(e) => setRegister({ ...register, name: e.target.value })}
                                        aria-invalid={!!registerErrors.name}
                                    />
                                    {registerErrors.name && <div className="error">{registerErrors.name}</div>}
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <label className="muted" htmlFor="register-email">Email</label>
                                    <input
                                        id="register-email"
                                        type="email"
                                        value={register.email}
                                        onChange={(e) => setRegister({ ...register, email: e.target.value })}
                                        aria-invalid={!!registerErrors.email}
                                    />
                                    {registerErrors.email && <div className="error">{registerErrors.email}</div>}
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <label className="muted" htmlFor="register-password">Password</label>
                                    <input
                                        id="register-password"
                                        type="password"
                                        value={register.password}
                                        onChange={(e) => setRegister({ ...register, password: e.target.value })}
                                        aria-invalid={!!registerErrors.password}
                                    />
                                    {registerErrors.password && <div className="error">{registerErrors.password}</div>}
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <label className="muted" htmlFor="register-confirm">Confirmar Password</label>
                                    <input
                                        id="register-confirm"
                                        type="password"
                                        value={register.confirm}
                                        onChange={(e) => setRegister({ ...register, confirm: e.target.value })}
                                        aria-invalid={!!registerErrors.confirm}
                                    />
                                    {registerErrors.confirm && <div className="error">{registerErrors.confirm}</div>}
                                </div>

                                {registerErrors.general && (
                                    <div className="error" style={{ marginBottom: 12 }}>
                                        {registerErrors.general}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        className="btn secondary"
                                        onClick={() => setShowRegisterForm(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn">Criar conta</button>
                                </div>
                            </form>
                        </section>
                    </dialog>
                </>
            )}

            <style>{`
                @media (max-width: 780px) {
                    .side-by-side { flex-direction: column; padding: 16px; }
                    .card { width: 100%; margin: 8px 0; }
                }
                .side-by-side { display: flex; gap: 24px; align-items: stretch; }
                .card, .modal .card { color: #111; }
                .card input, .card label, .card .muted { color: #111; }

                .card input,
                .modal .card input {
                    background: #fff;
                    color: #111;
                    caret-color: #111;
                    -webkit-text-fill-color: #111;
                    border: 1px solid #e5e7eb;
                }

                input {
                    width:100%;
                    padding:10px 12px;
                    border-radius:6px;
                    background: #fff;
                    color: #111;
                }

                input::placeholder {
                    color: #9ca3af;
                    opacity: 1;
                }

                .error { color:#d32f2f; font-size:13px; margin-top:6px; }
                .muted { color:#6b7280; font-size:14px; }
                .card {
                    background: #fff;
                    border-radius: 8px;
                    box-shadow: 0 6px 18px rgba(0,0,0,0.06);
                    padding: 28px;
                    width: 100%;
                    max-width: 520px;
                }
                .brand { display:flex; gap:12px; align-items:center; margin-bottom: 18px; }
                .brand-logo {
                    width:44px;
                    height:44px;
                    background:linear-gradient(135deg,#1f8bf5,#4bd3a8);
                    border-radius:8px;
                    display:inline-block;
                }
                .btn {
                    background:#1f8bf5;
                    color:#fff;
                    border:0;
                    padding:10px 14px;
                    border-radius:6px;
                    cursor:pointer;
                }
                .btn.secondary {
                    background:#f3f4f6;
                    color:#111;
                    border:1px solid #e5e7eb;
                }
                .modal-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.45);
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    z-index: 9999;
                    border: none;
                    padding: 0;
                }
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
        flex: 1
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
