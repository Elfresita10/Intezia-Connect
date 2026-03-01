import React, { useEffect, useState } from 'react';
import { History, Clock, FileText, User as UserIcon } from 'lucide-react';
import { getDb } from '../db/db';
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

    useEffect(() => {
        if (!canViewAuditLog(user?.role)) return;

        const fetchLogs = async () => {
            try {
                const db = getDb();
                // Fetch logs in descending order (newest first)
                const rows = await db.exec({
                    sql: 'SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100',
                    returnValue: 'resultRows',
                    rowMode: 'object'
                });
                setLogs(rows as unknown as AuditLogEntry[]);
            } catch (e) {
                console.error(e);
            }
        };

        fetchLogs();
    }, [user?.role]);

    if (!canViewAuditLog(user?.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    const getActionColor = (action: string) => {
        if (action === 'Creó') return '#2ecc71';
        if (action === 'Editó') return '#3498db';
        if (action === 'Eliminó') return '#e74c3c';
        return 'var(--text-secondary)';
    };

    return (
        <div className="animate-fade-in relative">
            <div className="flex space-between align-center mb-2">
                <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <History size={24} color="var(--accent)" />
                    Bitácora de Eventos
                </h2>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Registro de auditoría exclusivo para el rol de Super Administrador. Mostrando los últimos 100 cambios.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {logs.map((log) => (
                    <div key={log.id} className="card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', borderLeft: `4px solid ${getActionColor(log.action)}` }}>
                        <div style={{ flex: 1 }}>
                            <div className="flex space-between align-center mb-1">
                                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <UserIcon size={14} color="var(--text-secondary)" />
                                    {log.user_name}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={12} />
                                    {new Date(log.timestamp).toLocaleString()}
                                </span>
                            </div>

                            <p style={{ margin: '8px 0', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                <span style={{ color: getActionColor(log.action), fontWeight: 600 }}>{log.action}</span> un registro de tipo <strong style={{ color: '#fff' }}>{log.entity}</strong>.
                            </p>

                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                <FileText size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                                <span>{log.details}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {logs.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                        <History size={48} color="rgba(255,255,255,0.1)" style={{ margin: '0 auto 1rem' }} />
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No hay eventos registrados en la bitácora aún.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLog;
