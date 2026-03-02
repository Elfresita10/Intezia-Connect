import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, CircleDashed, AlertCircle, Plus, Edit2, Trash2, X, User as UserIcon } from 'lucide-react';
import { getOrInitDB, logAction, Project, ProjectTask } from '../db/db';
import { useAuth } from '../context/AuthContext';
import { canDelete } from '../utils/permissions';
import { useAlert } from '../context/AlertContext';

const ProjectDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showAlert, showConfirm } = useAlert();

    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<ProjectTask[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'Pendiente',
        assigned_to: user?.name || ''
    });

    const isConsultant = user?.role === 'Consultor';

    const fetchProjectAndTasks = async () => {
        try {
            const db = await getOrInitDB();
            const projRows = await db.exec({
                sql: 'SELECT * FROM projects WHERE id = ?',
                bind: [id],
                returnValue: 'resultRows'
            });
            if (projRows && projRows.length > 0) {
                setProject(projRows[0] as unknown as Project);
            }

            const taskRows = await db.exec({
                sql: 'SELECT * FROM project_tasks WHERE project_id = ?',
                bind: [id],
                returnValue: 'resultRows'
            });
            setTasks(taskRows || []);
        } catch (e) {
            console.error("Fetch Project Details Error:", e);
            showAlert('Error al cargar detalles del proyecto.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchProjectAndTasks();
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
        if (!canDelete(user?.role)) return;

        showConfirm(
            `¿Estás seguro de que deseas eliminar la tarea "${taskTitle}"?`,
            async () => {
                try {
                    const db = await getOrInitDB();
                    await db.exec({ sql: 'DELETE FROM project_tasks WHERE id = ?', bind: [taskId] });
                    await logAction(user?.name || 'Sistema', 'Eliminó Tarea', 'Proyecto', `Eliminó: ${taskTitle}`);
                    showAlert('Tarea eliminada.', 'success');
                    fetchProjectAndTasks();
                } catch (e) {
                    console.error(e);
                    showAlert('Error al eliminar la tarea.', 'error');
                }
            },
            'Eliminar Tarea'
        );
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const db = await getOrInitDB();
            if (editingTask) {
                await db.exec({
                    sql: 'UPDATE project_tasks SET title = ?, description = ?, status = ?, assigned_to = ? WHERE id = ?',
                    bind: [formData.title, formData.description, formData.status, formData.assigned_to, editingTask.id]
                });
                await logAction(user?.name || 'Sistema', 'Actualizó Tarea', 'Proyecto', `Editó: ${formData.title}`);
                showAlert('Tarea actualizada.', 'success');
            } else {
                await db.exec({
                    sql: 'INSERT INTO project_tasks (project_id, title, description, status, assigned_to) VALUES (?, ?, ?, ?, ?)',
                    bind: [id, formData.title, formData.description, formData.status, formData.assigned_to]
                });
                await logAction(user?.name || 'Sistema', 'Creó Tarea', 'Proyecto', `Creó: ${formData.title}`);
                showAlert('Nueva tarea asignada.', 'success');
            }
            setIsModalOpen(false);
            fetchProjectAndTasks();
        } catch (e) {
            console.error("Save Task Error:", e);
            showAlert('Error al guardar la tarea.', 'error');
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Pendiente': return <CircleDashed size={16} color="var(--text-secondary)" />;
            case 'En Progreso': return <Clock size={16} color="var(--accent)" />;
            case 'En Revisión': return <AlertCircle size={16} color="#f39c12" />;
            case 'Completado': return <CheckCircle2 size={16} color="#2ecc71" />;
            default: return <CircleDashed size={16} />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pendiente': return 'var(--text-secondary)';
            case 'En Progreso': return 'var(--accent)';
            case 'En Revisión': return '#f39c12';
            case 'Completado': return '#2ecc71';
            default: return 'var(--text-secondary)';
        }
    };

    if (loading) return <div className="skeleton" style={{ height: '400px', borderRadius: '20px' }}></div>;
    if (!project) return <div className="p-4" style={{ textAlign: 'center' }}>Proyecto no encontrado.</div>;

    return (
        <div className="animate-fade-in relative">
            <button onClick={() => navigate('/projects')} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '1.5rem', padding: 0 }}>
                <ArrowLeft size={16} /> Volver a Proyectos
            </button>

            <div className="glass-card mb-2" style={{ borderLeft: '4px solid var(--accent)', padding: '24px' }}>
                <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0', color: '#fff' }}>{project.title}</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    <span>Cliente: <strong style={{ color: '#fff' }}>{project.client}</strong></span>
                    <span>Fecha Límite: <strong style={{ color: '#fff' }}>{project.dueDate}</strong></span>
                    <span>Estado: <strong style={{ color: 'var(--accent)' }}>{project.status}</strong></span>
                </div>
            </div>

            <div className="flex space-between align-center mb-2 mt-3">
                <h3 className="section-title" style={{ margin: 0 }}>Roadmap de Tareas</h3>
                <button onClick={handleOpenCreate} className="btn" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                    <Plus size={16} /> Nueva Tarea
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100%, 1fr))', gap: '1rem' }}>
                {tasks.map(task => (
                    <div key={task.id} className="glass-card fade-in" style={{ padding: '20px', margin: 0, borderRight: `4px solid ${getStatusColor(task.status)}` }}>
                        <div className="flex space-between align-center">
                            <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {getStatusIcon(task.status)}
                                {task.title}
                            </h4>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleOpenEdit(task)} className="btn-icon">
                                    <Edit2 size={16} />
                                </button>
                                {!isConsultant && (
                                    <button onClick={() => handleDelete(task.id, task.title)} className="btn-icon" style={{ color: '#ff6b6b' }}>
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <p style={{ margin: '1rem 0', fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{task.description}</p>
                        <div className="flex space-between align-center" style={{ marginTop: '1rem' }}>
                            <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', background: 'rgba(88,166,255,0.1)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(88,166,255,0.2)' }}>
                                <UserIcon size={12} /> {task.assigned_to}
                            </span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: getStatusColor(task.status), textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {task.status}
                            </span>
                        </div>
                    </div>
                ))}
                {tasks.length === 0 && (
                    <div className="glass-card" style={{ textAlign: 'center', opacity: 0.5, padding: '3rem' }}>
                        No hay tareas registradas.
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
                    <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '450px', padding: '32px' }}>
                        <div className="flex space-between align-center mb-2">
                            <h3 style={{ margin: 0, color: '#fff' }}>{editingTask ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Título</label>
                                <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="form-input" />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Descripción</label>
                                <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="form-input" style={{ minHeight: '100px' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Asignado a</label>
                                <input required type="text" value={formData.assigned_to} onChange={e => setFormData({ ...formData, assigned_to: e.target.value })} className="form-input" />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Estado</label>
                                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="form-input" style={{ appearance: 'auto' }}>
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="En Progreso">En Progreso</option>
                                    <option value="En Revisión">En Revisión</option>
                                    {!isConsultant && <option value="Completado">Completado</option>}
                                </select>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
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
