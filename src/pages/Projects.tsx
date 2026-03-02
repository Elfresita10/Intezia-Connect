import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Briefcase, ChevronRight, Edit2, Trash2, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { canCreate, canEdit, canDelete } from '../utils/permissions';
import { Project } from '../db/db';
import { NotificationService } from '../utils/NotificationService';

const Projects: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [formData, setFormData] = useState({ title: '', client: '', status: 'En Progreso', progress: 0, dueDate: '' });

    const fetchProjects = async () => {
        try {
            const { getOrInitDB } = await import('../db/db');
            const db = await getOrInitDB();
            const rows = await db.exec({
                sql: 'SELECT * FROM projects ORDER BY id DESC',
                returnValue: 'resultRows',
                rowMode: 'object'
            });
            setProjects(rows as unknown as Project[]);
        } catch (e) {
            console.error('Fetch Projects failed:', e);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleOpenCreate = () => {
        if (!canCreate(user?.role)) return;
        setEditingProject(null);
        setFormData({ title: '', client: '', status: 'En Progreso', progress: 0, dueDate: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (proj: Project) => {
        if (!canEdit(user?.role)) return;
        setEditingProject(proj);
        setFormData({ title: proj.title, client: proj.client, status: proj.status, progress: proj.progress, dueDate: proj.dueDate });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number, title: string) => {
        if (!canDelete(user?.role)) return;
        if (!window.confirm(`¿Seguro que deseas eliminar el proyecto "${title}"?`)) return;

        try {
            const { getOrInitDB, logAction } = await import('../db/db');
            const db = await getOrInitDB();
            await db.exec({ sql: 'DELETE FROM projects WHERE id = ?', bind: [id] });
            await logAction(user?.name || 'Sistema', 'Eliminó', 'Proyecto', `Proyecto: ${title}`);
            fetchProjects();
        } catch (e) {
            alert('Error al eliminar proyecto');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { getOrInitDB, logAction } = await import('../db/db');
            const db = await getOrInitDB();

            if (editingProject) {
                // Edit Logic
                const sql = user?.role === 'Consultor'
                    ? 'UPDATE projects SET status = ?, progress = ? WHERE id = ?'
                    : 'UPDATE projects SET title = ?, client = ?, status = ?, progress = ?, dueDate = ? WHERE id = ?';

                const bind = user?.role === 'Consultor'
                    ? [formData.status, formData.progress, editingProject.id]
                    : [formData.title, formData.client, formData.status, formData.progress, formData.dueDate, editingProject.id];

                await db.exec({ sql, bind });
                await logAction(user?.name || 'Sistema', 'Editó', 'Proyecto', `Proyecto: ${formData.title}`);
            } else {
                // Create Logic
                if (!canCreate(user?.role)) return;
                await db.exec({
                    sql: 'INSERT INTO projects (title, client, status, progress, dueDate) VALUES (?, ?, ?, ?, ?)',
                    bind: [formData.title, formData.client, formData.status, formData.progress, formData.dueDate]
                });
                await logAction(user?.name || 'Sistema', 'Creó', 'Proyecto', `Proyecto: ${formData.title}`);

                NotificationService.sendLocalNotification('Nuevo Proyecto', {
                    body: `Proyecto registrado: ${formData.title}`,
                    tag: 'new-project'
                });
            }
            setIsModalOpen(false);
            fetchProjects();
        } catch (e) {
            console.error('Save error:', e);
            const msg = e instanceof Error ? e.message : 'Error desconocido';
            alert('Error al guardar datos: ' + msg);
        }
    };

    return (
        <div className="animate-fade-in relative">
            <div className="flex flex-wrap space-between align-center mb-2" style={{ gap: '12px' }}>
                <h2 className="section-title text-truncate" style={{ margin: 0, flex: 1, minWidth: '150px' }}>Mis Proyectos</h2>
                {canCreate(user?.role) && (
                    <button className="btn" onClick={handleOpenCreate} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                        <Plus size={16} /> Nuevo Proyecto
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {projects.map((proj) => (
                    <div
                        key={proj.id}
                        className="glass-card"
                        style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', cursor: 'pointer', padding: '16px' }}
                        onClick={() => navigate(`/projects/${proj.id}`)}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', width: '100%' }}>
                            <div style={{ width: 48, height: 48, borderRadius: '16px', background: 'rgba(255,215,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(255,215,0,0.2)' }}>
                                <Briefcase size={24} color="var(--accent)" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 className="text-truncate" style={{ fontSize: '1.05rem', margin: 0, color: '#fff', marginBottom: '4px' }}>{proj.title}</h3>
                                <p className="text-truncate" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{proj.client}</p>

                                <div className="flex align-center gap-2" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    <Calendar size={12} /> {proj.dueDate}
                                </div>

                                {proj.status === 'En Progreso' && (
                                    <div style={{ marginTop: '12px' }}>
                                        <div className="flex space-between mb-1" style={{ fontSize: '0.75rem' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>Progreso</span>
                                            <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{proj.progress}%</span>
                                        </div>
                                        <div className="progress-container">
                                            <div className="progress-bar" style={{ width: `${proj.progress}%` }}></div>
                                        </div>
                                    </div>
                                )}
                                {proj.status === 'Completado' && (
                                    <div style={{ marginTop: '12px' }}>
                                        <span className="badge success">Completado</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px', justifyContent: 'flex-end', width: '100%' }}>
                            {canEdit(user?.role) && (
                                <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(proj); }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }} title="Editar">
                                    <Edit2 size={14} /> Editar
                                </button>
                            )}
                            {canDelete(user?.role) && (
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(proj.id, proj.title); }} style={{ background: 'rgba(220,53,69,0.05)', border: '1px solid rgba(220,53,69,0.2)', borderRadius: '8px', color: '#ff6b6b', cursor: 'pointer', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }} title="Eliminar">
                                    <Trash2 size={14} /> Eliminar
                                </button>
                            )}
                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                Detalles <ChevronRight size={16} />
                            </div>
                        </div>
                    </div>
                ))}
                {projects.length === 0 && <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No hay proyectos disponibles en este momento.</p>}
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
                    <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '450px', position: 'relative', background: '#121212', padding: '30px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: 0.6 }}>
                            <X size={28} />
                        </button>
                        <h3 style={{ margin: '0 0 20px', color: '#fff', fontSize: '1.5rem', fontWeight: 700 }}>{editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h3>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {user?.role !== 'Consultor' ? (
                                <>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Título</label>
                                        <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="form-input" style={{ width: '100%', padding: '0.6rem', marginTop: '0.2rem' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cliente</label>
                                        <input required type="text" value={formData.client} onChange={e => setFormData({ ...formData, client: e.target.value })} className="form-input" style={{ width: '100%', padding: '0.6rem', marginTop: '0.2rem' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Fecha Límite</label>
                                        <input required type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className="form-input" style={{ width: '100%', padding: '0.6rem', marginTop: '0.2rem' }} />
                                    </div>
                                </>
                            ) : (
                                <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Estás editando el progreso limitado de:</p>
                                    <h4 style={{ margin: '4px 0 0', color: '#fff' }}>{formData.title}</h4>
                                </div>
                            )}

                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estado</label>
                                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="form-input" style={{ width: '100%', padding: '0.6rem', marginTop: '0.2rem', appearance: 'auto' }}>
                                    <option value="En Progreso">En Progreso</option>
                                    <option value="Completado">Completado</option>
                                    <option value="Pausado">Pausado</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Progreso (%)</label>
                                <input type="number" min="0" max="100" value={formData.progress} onChange={e => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })} className="form-input" style={{ width: '100%', padding: '0.6rem', marginTop: '0.2rem' }} />
                                <input type="range" min="0" max="100" value={formData.progress} onChange={e => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })} style={{ width: '100%', marginTop: '0.5rem' }} />
                            </div>

                            <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                                Guardar Cambios
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;
