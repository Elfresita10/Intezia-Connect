import React, { useEffect, useState } from 'react';
import { Plus, Search, Calendar, Edit2, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getOrInitDB, Project, logAction } from '../db/db';
import { canCreate, canEdit, canDelete } from '../utils/permissions';

const Projects: React.FC = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        title: '',
        client: '',
        dueDate: '',
        status: 'En Progreso' as 'En Progreso' | 'Completado' | 'Pausado',
        progress: 0
    });

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const db = await getOrInitDB();
            const result = await db.exec({
                sql: 'SELECT * FROM projects ORDER BY id DESC',
                returnValue: 'resultRows'
            });
            setProjects(result || []);
        } catch (error) {
            console.error('Fetch Projects failed:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleOpenCreate = () => {
        if (!canCreate(user?.role)) return;
        setEditingProject(null);
        setFormData({ title: '', client: '', dueDate: '', status: 'En Progreso', progress: 0 });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (project: Project) => {
        if (!canEdit(user?.role)) return;
        setEditingProject(project);
        setFormData({
            title: project.title,
            client: project.client,
            dueDate: project.dueDate,
            status: project.status,
            progress: project.progress
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number, title: string) => {
        if (!canDelete(user?.role)) return;
        if (window.confirm(`¿Estás seguro de que deseas eliminar el proyecto "${title}"?`)) {
            try {
                const db = await getOrInitDB();
                await db.exec({
                    sql: 'DELETE FROM projects WHERE id = ?',
                    bind: [id]
                });
                await logAction(user?.name || 'Sistema', 'Eliminó Proyecto', 'Proyectos', `Eliminó: ${title}`);
                fetchProjects();
            } catch (error) {
                console.error('Delete failed:', error);
                alert('Error al eliminar el proyecto.');
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const db = await getOrInitDB();
            if (editingProject) {
                if (!canEdit(user?.role)) return;
                await db.exec({
                    sql: 'UPDATE projects SET title = ?, client = ?, dueDate = ?, status = ?, progress = ? WHERE id = ?',
                    bind: [formData.title, formData.client, formData.dueDate, formData.status, formData.progress, editingProject.id]
                });
                await logAction(user?.name || 'Sistema', 'Actualizó Proyecto', 'Proyectos', `Editó: ${formData.title}`);
            } else {
                if (!canCreate(user?.role)) return;
                await db.exec({
                    sql: 'INSERT INTO projects (title, client, dueDate, status, progress) VALUES (?, ?, ?, ?, ?)',
                    bind: [formData.title, formData.client, formData.dueDate, formData.status, formData.progress]
                });
                await logAction(user?.name || 'Sistema', 'Creó Proyecto', 'Proyectos', `Creó: ${formData.title}`);
            }
            setIsModalOpen(false);
            fetchProjects();
        } catch (e) {
            console.error('Save error:', e);
            const msg = e instanceof Error ? e.message : 'Error desconocido';
            alert('Error al guardar datos: ' + msg);
        }
    };

    const filteredProjects = projects.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Completado': return <CheckCircle2 size={16} className="text-success" />;
            case 'En Progreso': return <Clock size={16} className="text-accent" />;
            case 'Pausado': return <AlertCircle size={16} className="text-secondary" />;
            default: return null;
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex flex-wrap space-between align-center mb-2" style={{ gap: '16px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>Gestión de Proyectos</h2>
                {canCreate(user?.role) && (
                    <button onClick={handleOpenCreate} className="btn">
                        <Plus size={18} /> Nuevo Proyecto
                    </button>
                )}
            </div>

            <div className="glass-card mb-2" style={{ padding: '12px' }}>
                <div className="flex align-center gap-1" style={{ width: '100%' }}>
                    <Search size={20} style={{ color: 'var(--text-secondary)', marginLeft: '8px' }} />
                    <input
                        type="text"
                        placeholder="Buscar por proyecto o cliente..."
                        className="form-input"
                        style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="skeleton" style={{ height: '400px', borderRadius: '20px' }}></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {filteredProjects.map(project => (
                        <div key={project.id} className="glass-card fade-in" style={{ padding: '24px', borderLeft: `4px solid ${project.status === 'Completado' ? '#4CAF50' : project.status === 'Pausado' ? '#FFC107' : 'var(--accent)'}` }}>
                            <div className="flex space-between align-start mb-1">
                                <div>
                                    <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', color: '#fff' }}>{project.title}</h3>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cliente: <span style={{ color: '#fff' }}>{project.client}</span></p>
                                </div>
                                <div className="flex gap-1">
                                    {canEdit(user?.role) && (
                                        <button onClick={() => handleOpenEdit(project)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                            <Edit2 size={16} />
                                        </button>
                                    )}
                                    {canDelete(user?.role) && (
                                        <button onClick={() => handleDelete(project.id, project.title)} style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex align-center gap-1 mb-1">
                                {getStatusIcon(project.status)}
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: project.status === 'Completado' ? '#4CAF50' : project.status === 'Pausado' ? '#FFC107' : 'var(--accent)' }}>
                                    {project.status.toUpperCase()}
                                </span>
                            </div>

                            <div className="mb-1">
                                <div className="flex space-between align-center mb-half">
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Progreso</span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{project.progress}%</span>
                                </div>
                                <div className="progress-container">
                                    <div className="progress-bar" style={{ width: `${project.progress}%` }}></div>
                                </div>
                            </div>

                            <div className="flex align-center gap-half" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                <Calendar size={14} />
                                <span>Entrega: {project.dueDate}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && filteredProjects.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem 0', opacity: 0.5 }}>
                    <p>No se encontraron proyectos.</p>
                </div>
            )}

            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
                    <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
                        <h3 style={{ margin: '0 0 24px', fontSize: '1.5rem', color: '#fff' }}>{editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h3>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Nombre del Proyecto</label>
                                <input required type="text" className="form-input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Cliente</label>
                                <input required type="text" className="form-input" value={formData.client} onChange={e => setFormData({ ...formData, client: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Fecha Límite</label>
                                    <input required type="date" className="form-input" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Estado</label>
                                    <select className="form-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })} style={{ appearance: 'auto' }}>
                                        <option value="En Progreso">En Progreso</option>
                                        <option value="Completado">Completado</option>
                                        <option value="Pausado">Pausado</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Progreso ({formData.progress}%)</label>
                                <input type="range" min="0" max="100" step="5" value={formData.progress} onChange={e => setFormData({ ...formData, progress: parseInt(e.target.value) })} style={{ width: '100%', accentColor: 'var(--accent)' }} />
                            </div>

                            <div className="flex gap-1 mt-1">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                                <button type="submit" className="btn" style={{ flex: 2 }}>Guardar Proyecto</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;
