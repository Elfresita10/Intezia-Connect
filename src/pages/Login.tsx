import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/images/logo-app.png';
import { User as UserIcon, LogIn, Lock } from 'lucide-react';

export default function Login() {
    const { login, user } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            setError('Todos los campos son obligatorios');
            return;
        }

        setIsLoading(true);
        setError('');

        const success = await login(username, password);
        if (success) {
            navigate('/dashboard', { replace: true });
        } else {
            setError('Usuario o contraseña incorrectos');
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'radial-gradient(circle at center, #161b22 0%, #0d1117 100%)',
            zIndex: 2147483647,
            margin: 0,
            padding: '1rem',
            overflow: 'hidden'
        }}>
            {/* Background Glows */}
            <div style={{ position: 'absolute', top: '20%', left: '30%', width: '300px', height: '300px', background: 'var(--accent)', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%', pointerEvents: 'none' }}></div>
            <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: '250px', height: '250px', background: 'var(--accent)', filter: 'blur(150px)', opacity: 0.1, borderRadius: '50%', pointerEvents: 'none' }}></div>

            <div style={{ zIndex: 1, width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem', width: '100%' }}>
                    <div style={{ margin: '0 auto 2.5rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <img src={logo} alt="Logo" style={{ height: '6rem', width: 'auto', filter: 'drop-shadow(0 0 25px var(--accent-glow))' }} />
                    </div>
                    <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.025em', margin: '0.5rem 0 0', fontFamily: 'Outfit, sans-serif' }}>
                        Bienvenido
                    </h2>
                    <p style={{ marginTop: '0.75rem', fontSize: '1rem', color: 'var(--text-secondary)', fontFamily: 'Outfit, sans-serif' }}>
                        Inicia sesión en la plataforma de consultores
                    </p>
                </div>

                <div style={{
                    background: 'rgba(22, 27, 34, 0.75)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                    padding: '2.5rem',
                    borderRadius: '1.25rem',
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }} onSubmit={handleLogin}>
                        <div style={{ width: '100%' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#e6edf3', fontFamily: 'system-ui, sans-serif' }}>
                                Correo Electrónico
                            </label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                                <div style={{ position: 'absolute', left: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                    <UserIcon style={{ height: '1.2rem', width: '1.2rem', color: '#848d97' }} />
                                </div>
                                <input
                                    type="email"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="ejemplo@intezia.com"
                                    style={{
                                        width: '100%',
                                        padding: '0.85rem 1rem 0.85rem 3rem',
                                        background: 'rgba(13, 17, 23, 0.8)',
                                        border: '1px solid #30363d',
                                        borderRadius: '0.75rem',
                                        color: '#e6edf3',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.2s',
                                        fontFamily: 'system-ui, sans-serif'
                                    }}
                                    autoComplete="username"
                                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = '#30363d'; e.currentTarget.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>

                        <div style={{ width: '100%' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: '#e6edf3', fontFamily: 'system-ui, sans-serif' }}>
                                Contraseña
                            </label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                                <div style={{ position: 'absolute', left: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                    <Lock style={{ height: '1.2rem', width: '1.2rem', color: '#848d97' }} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%',
                                        padding: '0.85rem 1rem 0.85rem 3rem',
                                        background: 'rgba(13, 17, 23, 0.8)',
                                        border: '1px solid #30363d',
                                        borderRadius: '0.75rem',
                                        color: '#e6edf3',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.2s',
                                        fontFamily: 'system-ui, sans-serif'
                                    }}
                                    autoComplete="current-password"
                                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = '#30363d'; e.currentTarget.style.boxShadow = 'none'; }}
                                />
                            </div>
                        </div>

                        {error && (
                            <div style={{ background: 'rgba(220,53,69,0.15)', color: '#ff7b72', padding: '0.85rem', borderRadius: '0.5rem', fontSize: '0.9rem', textAlign: 'center', border: '1px solid rgba(220,53,69,0.3)', fontFamily: 'system-ui, sans-serif', width: '100%', boxSizing: 'border-box' }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: '1rem',
                                marginTop: '1rem',
                                fontSize: '1rem',
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, var(--accent), #d29922)',
                                color: 'black',
                                border: 'none',
                                borderRadius: '0.75rem',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.7 : 1,
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 14px var(--accent-glow)',
                                fontFamily: 'system-ui, sans-serif',
                                boxSizing: 'border-box'
                            }}
                            onMouseOver={(e) => { if (!isLoading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseOut={(e) => { if (!isLoading) e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            {isLoading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <svg style={{ animation: 'spin 1s linear infinite', height: '1.25rem', width: '1.25rem', color: 'white' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Autenticando...
                                </span>
                            ) : (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Ingresar al Sistema <LogIn style={{ height: '1.25rem', width: '1.25rem' }} />
                                </span>
                            )}
                        </button>
                    </form>
                </div>
            </div>
            <style>
                {`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                `}
            </style>
        </div>
    );
}
