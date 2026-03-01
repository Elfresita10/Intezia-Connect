import React, { useEffect, useState } from 'react';
import { Trophy, Clock, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDb, Project } from '../db/db';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState({ projects: 0, education: 0 });
    const [latestProject, setLatestProject] = useState<Project | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const db = getDb();
                const projCount = await db.exec({ sql: "SELECT count(*) as count FROM projects", returnValue: 'resultRows', rowMode: 'object' });
                const eduCount = await db.exec({ sql: "SELECT count(*) as count FROM education WHERE status = 'Realizada'", returnValue: 'resultRows', rowMode: 'object' });
                const recentProj = await db.exec({ sql: "SELECT * FROM projects WHERE status = 'En Progreso' ORDER BY id DESC LIMIT 1", returnValue: 'resultRows', rowMode: 'object' });

                setStats({
                    projects: projCount[0]?.count || 0,
                    education: eduCount[0]?.count || 0
                });

                if (recentProj.length > 0) {
                    setLatestProject(recentProj[0] as unknown as Project);
                }
            } catch (e) {
                console.error("Error fetching dashboard data:", e);
            }
        };

        fetchDashboardData();
    }, []);

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
                maxWidth: '800px'
            }}>
                <h2 className="text-truncate" style={{ fontSize: '2.4rem', marginBottom: '0.5rem', color: '#fff', fontWeight: 800, padding: '0 20px' }}>Hola, {user?.name.split(' ')[0] || 'Consultor'}</h2>
                <p className="text-truncate" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '1.1rem', opacity: 0.9, marginBottom: '2.5rem', padding: '0 20px' }}>{user?.title || 'Consultor Intezia'}</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', justifyContent: 'center', width: '100%' }}>
                    <div style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            <CheckCircle2 size={20} color="#3fb950" /> Proyectos
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff' }}>{stats.projects}</div>
                    </div>
                    <div style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            <Trophy size={20} color="#d29922" /> Certificados
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff' }}>{stats.education}</div>
                    </div>
                </div>
            </div>

            <div style={{ width: '100%', maxWidth: '800px', marginTop: '2.5rem' }}>
                <div className="flex flex-wrap space-between align-center mb-1" style={{ gap: '12px' }}>
                    <h3 className="section-title" style={{ marginBottom: 0, fontSize: '1.3rem', whiteSpace: 'nowrap' }}>Proyectos Activos</h3>
                    <button className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'rgba(255,215,0,0.1)', color: 'var(--accent)', boxShadow: 'none', border: '1px solid rgba(255,215,0,0.2)' }} onClick={() => navigate('/projects')}>
                        Ver todos
                    </button>
                </div>

                {latestProject ? (
                    <div className="glass-card" style={{ width: '100%', margin: 0, cursor: 'pointer' }} onClick={() => navigate(`/projects/${latestProject.id}`)}>
                        <div className="flex flex-wrap space-between align-center mb-1" style={{ gap: '12px' }}>
                            <h3 className="text-truncate" style={{ margin: 0, fontSize: '1.2rem', maxWidth: '70%' }}>{latestProject.title}</h3>
                            <span className="badge warning" style={{ whiteSpace: 'nowrap' }}>{latestProject.status}</span>
                        </div>
                        <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>Cliente: {latestProject.client}</p>

                        <div className="flex align-center gap-2 mb-1" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <Clock size={16} /> Entrega: {latestProject.dueDate}
                        </div>

                        <div className="progress-container" style={{ height: '10px', background: 'rgba(255,255,255,0.08)' }}>
                            <div className="progress-bar" style={{ width: `${latestProject.progress}%`, background: 'linear-gradient(90deg, var(--accent) 0%, #fff 100%)' }}></div>
                        </div>
                        <div className="flex space-between mt-1" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <span>Progreso</span>
                            <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{latestProject.progress}%</span>
                        </div>
                    </div>
                ) : (
                    <div className="glass-card" style={{ textAlign: 'center', opacity: 0.6 }}>
                        No hay proyectos activos recientemente.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
