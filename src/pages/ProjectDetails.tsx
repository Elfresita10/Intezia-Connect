import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, CircleDashed, AlertCircle, Plus, Edit2, Trash2, X, User as UserIcon } from 'lucide-react';
import { getDb, logAction, Project, ProjectTask } from '../db/db';
import { useAuth } from '../context/AuthContext';
import { canCreate } from '../utils/permissions';

const ProjectDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<ProjectTask[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);

    // Modal Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'Pendiente',
        assigned_to: user?.name || ''
    });

    const isConsultant = user?.role === 'Consultor';

    const fetchProjectAndTasks = async () => {
        try {
            const db = getDb();
            const projRows = await db.exec({ sql: 'SELECT * FROM projects WHERE id = ?', bind: [id], returnValue: 'resultRows', rowMode: 'object' });
            if (projRows.length > 0) {
                setProject(projRows[0] as unknown as Project);
            }

            const taskRows = await db.exec({ sql: 'SELECT * FROM project_tasks WHERE project_id = ?', bind: [id], returnValue: 'resultRows', rowMode: 'object' });
            setTasks(taskRows as unknown as ProjectTask[]);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchProjectAndTasks();
    }, [id]);

    const handleOpenCreate = () => {
        setEditingTask(null);
        setFormData({ title: '', description: '', status: 'Pendiente', assigned_to: user?.name || '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (task: ProjectTask) => {
        setEditingTask(task);
        setFormData({ title: task.title, description: task.description, status: task.status, assigned_to: task.assigned_to });
        setIsModalOpen(true);
    };

    const handleDelete = async (taskId: number, taskTitle: string) => {
        if (!canCreate(user?.role)) return; // Only Admins/Super Admins can delete
        if (window.confirm('¿Seguro que deseas eliminar esta tarea?')) {
            try {
                const db = getDb();
                await db.exec({ sql: 'DELETE FROM project_tasks WHERE id = ?', bind: [taskId] });
                await logAction(user?.name || 'Desconocido', 'Eliminó', 'Tarea de Proyecto', `Eliminó la tarea: ${taskTitle}`);
                fetchProjectAndTasks();
            } catch (e) { console.error(e); }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const db = getDb();
            if (editingTask) {
                await db.exec({
                    sql: 'UPDATE project_tasks SET title = ?, description = ?, status = ?, assigned_to = ? WHERE id = ?',
                    bind: [formData.title, formData.description, formData.status, formData.assigned_to, editingTask.id]
                });
                await logAction(user?.name || 'Desconocido', 'Editó', 'Tarea de Proyecto', `Actualizó la tarea: ${formData.title} a estatus ${formData.status}`);
            } else {
                await db.exec({
                    sql: 'INSERT INTO project_tasks (project_id, title, description, status, assigned_to) VALUES (?, ?, ?, ?, ?)',
                    bind: [id, formData.title, formData.description, formData.status, formData.assigned_to]
                });
                await logAction(user?.name || 'Desconocido', 'Creó', 'Tarea de Proyecto', `Añadió nueva tarea: ${formData.title}`);
            }
            setIsModalOpen(false);
            fetchProjectAndTasks();
        } catch (e) { console.error(e); }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Pendiente': return <CircleDashed size={16} color="var(--text-secondary)" />;
            case 'En Progreso': return <Clock size={16} color="#3498db" />;
            case 'En Revisión': return <AlertCircle size={16} color="#f39c12" />;
            case 'Completado': return <CheckCircle2 size={16} color="#2ecc71" />;
            default: return <CircleDashed size={16} />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pendiente': return 'var(--text-secondary)';
            case 'En Progreso': return '#3498db';
            case 'En Revisión': return '#f39c12';
            case 'Completado': return '#2ecc71';
            default: return 'var(--text-secondary)';
        }
    };

    if (!project) return <div className="p-4">Cargando proyecto...</div>;

    return (
        <div className="animate-fade-in relative">
            <button onClick={() => navigate('/projects')} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '1rem', padding: 0 }}>
                <ArrowLeft size={16} /> Volver a Proyectos
            </button>

            <div className="card mb-2" style={{ borderLeft: '4px solid var(--accent)' }}>
                <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0', color: '#fff' }}>{project.title}</h2>
                <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <span>Cliente: <strong style={{ color: '#fff' }}>{project.client}</strong></span>
                    <span>•</span>
                    <span>Finaliza: {project.dueDate}</span>
                </div>
            </div>

            <div className="flex space-between align-center mb-2 mt-2">
                <h3 style={{ margin: 0, color: '#fff' }}>Roadmap (Tareas)</h3>
                <button onClick={handleOpenCreate} className="badge" style={{ cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(135deg, var(--accent), #1f6feb)', color: '#fff' }}>
                    <Plus size={14} /> Nueva Tarea
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {tasks.map(task => (
                    <div key={task.id} className="card" style={{ padding: '1rem', margin: 0, borderRight: `4px solid ${getStatusColor(task.status)}` }}>
                        <div className="flex space-between align-center">
                            <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {getStatusIcon(task.status)}
                                {task.title}
                            </h4>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button onClick={() => handleOpenEdit(task)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem' }} title="Editar/Status">
                                    <Edit2 size={14} />
                                </button>
                                {!isConsultant && (
                                    <button onClick={() => handleDelete(task.id, task.title)} style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: '0.2rem' }} title="Eliminar">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{task.description}</p>
                        <div className="flex space-between align-center" style={{ marginTop: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', background: 'rgba(88,166,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                                <UserIcon size={12} /> {task.assigned_to}
                            </span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: getStatusColor(task.status) }}>
                                {task.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                ))}
                {tasks.length === 0 && <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No hay tareas registradas en este proyecto.</p>}
            </div>

            {/* Modal de Tareas */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'var(--card-bg, #161b22)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '400px', position: 'relative' }}>
                        <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                        <h3 style={{ margin: '0 0 1.5rem', color: '#fff' }}>{editingTask ? 'Gestionar Tarea' : 'Nueva Tarea'}</h3>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {(!isConsultant || !editingTask) && (
                                <>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Título de la Tarea</label>
                                        <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="form-input" style={{ width: '100%', padding: '0.6rem', marginTop: '0.2rem' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Descripción General</label>
                                        <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="form-input" style={{ width: '100%', padding: '0.6rem', marginTop: '0.2rem', minHeight: '80px', resize: 'vertical' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Asignar a (Correo)</label>
                                        <input required type="text" value={formData.assigned_to} onChange={e => setFormData({ ...formData, assigned_to: e.target.value })} className="form-input" style={{ width: '100%', padding: '0.6rem', marginTop: '0.2rem' }} />
                                    </div>
                                </>
                            )}

                            {(isConsultant && editingTask) && (
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#fff' }}>{formData.title}</h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formData.description}</p>
                                </div>
                            )}

                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Actualizar Estado</label>
                                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="form-input" style={{ width: '100%', padding: '0.6rem', marginTop: '0.2rem', appearance: 'auto' }}>
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="En Progreso">En Progreso</option>
                                    <option value="En Revisión">En Revisión (Finalizado por Consultor)</option>
                                    {!isConsultant && <option value="Completado">Completado (Verificado por Admin)</option>}
                                </select>
                            </div>

                            <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                                Guardar Tarea
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetails;
