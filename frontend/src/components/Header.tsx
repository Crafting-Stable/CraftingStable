import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoImg from '../assets/craftingstable.png';

export default function Header(): React.ReactElement {
    const navigate = useNavigate();

    const readUserFromStorage = () => {
        try {
            const jwt = localStorage.getItem('jwt');
            if (!jwt) return null;

            const userStr = localStorage.getItem('user');
            if (!userStr) return null;

            return JSON.parse(userStr);
        } catch {
            return null;
        }
    };

    const [user, setUser] = useState<{ username: string; role?: string } | null>(() => readUserFromStorage());

    useEffect(() => {
        const handleAuthChange = () => {
            setUser(readUserFromStorage());
        };

        window.addEventListener('storage', handleAuthChange);
        window.addEventListener('authChanged', handleAuthChange);

        return () => {
            window.removeEventListener('storage', handleAuthChange);
            window.removeEventListener('authChanged', handleAuthChange);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
        setUser(null);

        window.dispatchEvent(new Event('authChanged'));

        navigate('/');
    };

    const styles: Record<string, React.CSSProperties> = {
        header: {
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            boxSizing: 'border-box',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'transparent',
            color: '#fff'
        },
        headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
        logoText: { fontWeight: 700, fontSize: 20, color: '#f8b749' },
        logoImage: { width: 48, height: 'auto', marginRight: 12 },
        nav: { display: 'flex', gap: 12 },
        loginButton: {
            padding: '8px 14px',
            borderRadius: 8,
            background: '#f8b749',
            color: '#222',
            textDecoration: 'none',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer'
        },
        avatar: {
            width: 36,
            height: 36,
            borderRadius: 18,
            background: '#f8b749',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#222',
            fontWeight: 700,
            cursor: 'pointer'
        },
        logoutBtn: {
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'inherit',
            padding: '6px 10px',
            borderRadius: 8,
            cursor: 'pointer'
        }
    };

    return (
        <header style={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }}>
                    <img src={logoImg} alt="Crafting Stable logo" style={styles.logoImage} />
                    <div style={styles.logoText}>CraftingStable</div>
                </Link>

                <nav style={styles.nav}>
                    <Link to="/catalog" style={{ color: 'inherit', textDecoration: 'none' }}>Catálogo</Link>
                    {user && (
                        <Link to="/user/add-rent" style={{ color: 'inherit', textDecoration: 'none' }}>Add Rent</Link>
                    )}
                    {user?.role === 'ADMIN' && (
                        <Link to="/admin" style={{ color: 'inherit', textDecoration: 'none' }}>Admin</Link>
                    )}
                    <Link to="/about" style={{ color: 'inherit', textDecoration: 'none' }}>Sobre</Link>
                </nav>
            </div>

            <div style={styles.headerRight}>
                {user ? (
                    <>
                        <Link to="/user" aria-label="Perfil" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div style={styles.avatar}>
                                {user.username ? user.username[0].toUpperCase() : 'U'}
                            </div>
                        </Link>
                        <button onClick={handleLogout} style={styles.logoutBtn} aria-label="Sair">Sair</button>
                    </>
                ) : (
                    <Link to="/loginPage" style={styles.loginButton}>Iniciar sessão</Link>
                )}
            </div>
        </header>
    );
}
