import React from 'react';
import { useAlert } from '../context/AlertContext';
import { AlertCircle, CheckCircle, Info, XCircle, HelpCircle, X } from 'lucide-react';

const GlobalAlert: React.FC = () => {
    const { alertState, closeAlert } = useAlert();

    if (!alertState.show) return null;

    const getIcon = () => {
        switch (alertState.type) {
            case 'success': return <CheckCircle size={40} color="#2ecc71" />;
            case 'error': return <XCircle size={40} color="#ff6b6b" />;
            case 'warning': return <AlertCircle size={40} color="#f39c12" />;
            case 'confirm': return <HelpCircle size={40} color="var(--accent)" />;
            default: return <Info size={40} color="var(--accent)" />;
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div className="glass-card" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '32px',
                textAlign: 'center',
                position: 'relative',
                border: '1px solid rgba(255,215,0,0.2)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(255,215,0,0.05)'
            }}>
                <button
                    onClick={closeAlert}
                    className="btn-icon"
                    style={{ position: 'absolute', top: '16px', right: '16px', opacity: 0.5 }}
                >
                    <X size={20} />
                </button>

                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                    {getIcon()}
                </div>

                <h3 style={{ margin: '0 0 12px 0', color: '#fff', fontSize: '1.25rem', fontWeight: 700 }}>
                    {alertState.title}
                </h3>

                <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                    {alertState.message}
                </p>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    {alertState.type === 'confirm' ? (
                        <>
                            <button
                                onClick={alertState.onCancel}
                                className="btn btn-secondary"
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={alertState.onConfirm}
                                className="btn btn-primary"
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                Confirmar
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={closeAlert}
                            className="btn btn-primary"
                            style={{ minWidth: '120px', justifyContent: 'center' }}
                        >
                            Entendido
                        </button>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default GlobalAlert;
