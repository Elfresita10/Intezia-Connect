import React, { useEffect, useState } from 'react';
import { Trophy, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOrInitDB, Project } from '../db/db';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState({ projects: 0, education: 0 });
    const [latestProject, setLatestProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const db = await getOrInitDB();
                const projCount = await db.exec({ sql: "SELECT count(*) as count FROM projects", returnValue: 'resultRows' });
                const eduCount = await db.exec({ sql: "SELECT count(*) as count FROM education WHERE status = 'Realizada'", returnValue: 'resultRows' });
                const recentProj = await db.exec({ sql: "SELECT * FROM projects WHERE status = 'En Progreso' ORDER BY id DESC LIMIT 1", returnValue: 'resultRows' });

                setStats({
                    projects: projCount[0]?.count || 0,
                    education: eduCount[0]?.count || 0
                });

                if (recentProj && recentProj.length > 0) {
                    setLatestProject(recentProj[0] as unknown as Project);
                }
            } catch (e) {
                console.error("Dashboard DB Error:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return <div className="skeleton" style={{ height: '400px', borderRadius: '20px' }}></div>;

    return (
        <div className="animate-fade-in" style={{ width: '100%' }}>
            <div className="glass-card" style={{
                background: 'linear-gradient(135deg, rgba(255,215,0,0.05) 0%, rgba(0,0,0,0.9) 100%)',
                border: '1px solid rgba(255,215,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                width: '100%',
                maxWidth: '800px',
                padding: '2rem'
            }}>
                <h2 className="text-truncate" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#fff', fontWeight: 800 }}>
                    Hola, {user?.name.split(' ')[0] || 'Consultor'}
                </h2>
                <p style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '1rem', marginBottom: '2rem' }}>
                    {user?.title || 'Consultor Estratégico'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', width: '100%' }}>
                    <div className="glass-card stat-card" style={{ margin: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <CheckCircle2 size={18} color="#3fb950" /> Proyectos
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff' }}>{stats.projects}</div>
                    </div>
                    <div className="glass-card stat-card" style={{ margin: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <Trophy size={18} color="#d29922" /> Certificados
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff' }}>{stats.education}</div>
                    </div>
                </div>
            </div>

            <div style={{ width: '100%', maxWidth: '800px', marginTop: '3rem' }}>
                <div className="flex space-between align-center mb-1">
                    <h3 className="section-title" style={{ margin: 0 }}>Proyecto Reciente</h3>
                    <button className="btn btn-secondary" onClick={() => navigate('/projects')}>Ver todos</button>
                </div>

                {latestProject ? (
                    <div className="glass-card" style={{ cursor: 'pointer', borderLeft: '4px solid var(--accent)' }} onClick={() => navigate(`/projects/${latestProject.id}`)}>
                        <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '8px' }}>{latestProject.title}</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Cliente: {latestProject.client}</p>

                        <div className="progress-container" style={{ height: '8px', marginBottom: '8px' }}>
                            <div className="progress-bar" style={{ width: `${latestProject.progress}%` }}></div>
                        </div>
                        <div className="flex space-between" style={{ fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Progreso actual</span>
                            <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{latestProject.progress}%</span>
                        </div>
                    </div>
                ) : (
                    <div className="glass-card" style={{ textAlign: 'center', opacity: 0.6, padding: '3rem' }}>
                        No hay proyectos activos registrados.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
