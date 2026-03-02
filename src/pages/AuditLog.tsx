import React, { useEffect, useState } from 'react';
import { History, Clock, FileText, User as UserIcon } from 'lucide-react';
import { getOrInitDB } from '../db/db';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { canViewAuditLog } from '../utils/permissions';

interface AuditLogEntry {
    id: number;
    user_name: string;
    action: string;
    entity: string;
    details: string;
    timestamp: string;
}

const AuditLog: React.FC = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!canViewAuditLog(user?.role)) return;

        const fetchLogs = async () => {
            try {
                const db = await getOrInitDB();
                const rows = await db.exec({
                    sql: 'SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100',
                    returnValue: 'resultRows'
                });
                setLogs(rows || []);
            } catch (e) {
                console.error("Fetch Audit Logs Error:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [user?.role]);

    if (!canViewAuditLog(user?.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    const getActionColor = (action: string) => {
        if (action.includes('Creó')) return '#2ecc71';
        if (action.includes('Actualizó') || action.includes('Editó')) return 'var(--accent)';
        if (action.includes('Eliminó')) return '#ff6b6b';
        return 'var(--text-secondary)';
    };

    if (loading) return <div className="skeleton" style={{ height: '400px', borderRadius: '20px' }}></div>;

    return (
        <div className="animate-fade-in relative">
            <div className="flex space-between align-center mb-2">
                <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <History size={24} /> Bitácora de Auditoría
                </h2>
            </div>

            <div className="glass-card mb-2" style={{ padding: '16px', background: 'rgba(255,255,255,0.03)' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                    Registro histórico de operaciones. Solo accesible para administradores.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {logs.map((log) => (
                    <div key={log.id} className="glass-card fade-in" style={{ padding: '20px', borderLeft: `4px solid ${getActionColor(log.action)}` }}>
                        <div className="flex space-between align-center mb-1">
                            <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <UserIcon size={14} color="var(--accent)" />
                                {log.user_name}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Clock size={12} />
                                {new Date(log.timestamp).toLocaleString()}
                            </span>
                        </div>

                        <p style={{ margin: '8px 0', color: '#e6edf3', fontSize: '0.92rem' }}>
                            <span style={{ color: getActionColor(log.action), fontWeight: 700 }}>{log.action}</span> en <strong style={{ color: 'var(--accent)' }}>{log.entity}</strong>
                        </p>

                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '10px' }}>
                            <FileText size={14} style={{ marginTop: '2px' }} />
                            <span>{log.details}</span>
                        </div>
                    </div>
                ))}

                {logs.length === 0 && (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>No hay eventos registrados.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLog;
