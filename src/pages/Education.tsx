import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, BookOpen, ExternalLink, Edit2, Trash2, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { canCreate, canEdit, canDelete } from '../utils/permissions';
import { getOrInitDB, logAction, Education as EducationItem } from '../db/db';
import { NotificationService } from '../utils/NotificationService';
import { useAlert } from '../context/AlertContext';

const Education: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showAlert, showConfirm } = useAlert();
    const [education, setEducation] = useState<EducationItem[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<EducationItem | null>(null);
    const [formData, setFormData] = useState<{
        title: string;
        institution: string;
        year: string;
        type: 'Certificación' | 'Título' | 'Curso';
        status: 'Realizada' | 'Disponible' | 'En Progreso';
    }>({
        title: '',
        institution: '',
        year: new Date().getFullYear().toString(),
        type: 'Certificación',
        status: 'Disponible'
    });

    const fetchEducation = async () => {
        setLoading(true);
        try {
            const db = await getOrInitDB();
            const rows = await db.exec({
                sql: 'SELECT * FROM education ORDER BY year DESC',
                returnValue: 'resultRows'
            });
            setEducation(rows || []);
        } catch (e) {
            console.error("Fetch Education Error:", e);
            showAlert('Error al cargar los datos de educación.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEducation();
    }, []);

    const handleOpenCreate = () => {
        if (!canCreate(user?.role)) return;
        setEditingItem(null);
        setFormData({ title: '', institution: '', year: new Date().getFullYear().toString(), type: 'Certificación', status: 'Disponible' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: EducationItem) => {
        if (!canEdit(user?.role)) return;
        setEditingItem(item);
        setFormData({ title: item.title, institution: item.institution, year: item.year, type: item.type, status: item.status });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number, title: string) => {
        if (!canDelete(user?.role)) return;

        showConfirm(
            `¿Estás seguro de que deseas eliminar "${title}" de tus registros académicos?`,
            async () => {
                try {
                    const db = await getOrInitDB();
                    await db.exec({ sql: 'DELETE FROM education WHERE id = ?', bind: [id] });
                    await logAction(user?.name || 'Sistema', 'Eliminó Educación', 'Educación', `Eliminó: ${title}`);
                    showAlert('Registro eliminado.', 'success');
                    fetchEducation();
                } catch (e) {
                    console.error("Delete Error:", e);
                    showAlert('Error al eliminar el registro.', 'error');
                }
            },
            'Eliminar Registro'
        );
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const db = await getOrInitDB();
            if (editingItem) {
                if (!canEdit(user?.role)) return;
                await db.exec({
                    sql: 'UPDATE education SET title = ?, institution = ?, year = ?, type = ?, status = ? WHERE id = ?',
                    bind: [formData.title, formData.institution, formData.year, formData.type, formData.status, editingItem.id]
                });
                await logAction(user?.name || 'Sistema', 'Actualizó Educación', 'Educación', `Editó: ${formData.title}`);
                showAlert('Registro actualizado.', 'success');
            } else {
                if (!canCreate(user?.role)) return;
                await db.exec({
                    sql: 'INSERT INTO education (title, institution, year, type, status) VALUES (?, ?, ?, ?, ?)',
                    bind: [formData.title, formData.institution, formData.year, formData.type, formData.status]
                });
                await logAction(user?.name || 'Sistema', 'Creó Educación', 'Educación', `Añadió: ${formData.title}`);

                NotificationService.sendLocalNotification('Capacitación Añadida', {
                    body: `Se ha registrado: ${formData.title}`,
                    tag: 'new-edu'
                });
                showAlert('Nueva educación registrada con éxito.', 'success');
            }
            setIsModalOpen(false);
            fetchEducation();
        } catch (e) {
            console.error("Save Error:", e);
            showAlert('Error al guardar el registro.', 'error');
        }
    };

    const countRealizadas = education.filter(e => e.status === 'Realizada').length;
    const countEnProgreso = education.filter(e => e.status === 'En Progreso').length;
    const countDisponibles = education.filter(e => e.status === 'Disponible').length;

    return (
        <div className="animate-fade-in">
            <div className="flex flex-wrap space-between align-center mb-2" style={{ gap: '12px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>Formación y Capacitación</h2>
                {canCreate(user?.role) && (
                    <button onClick={handleOpenCreate} className="btn">
                        <Plus size={18} /> Añadir Registro
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="glass-card stat-card" style={{ borderTop: '4px solid #fff' }}>
                    <h4 className="stat-label">Realizadas</h4>
                    <span className="stat-value">{countRealizadas}</span>
                </div>
                <div className="glass-card stat-card" style={{ borderTop: '4px solid var(--accent)' }}>
                    <h4 className="stat-label">En Progreso</h4>
                    <span className="stat-value">{countEnProgreso}</span>
                </div>
                <div className="glass-card stat-card" style={{ borderTop: '4px solid rgba(255,255,255,0.2)' }}>
                    <h4 className="stat-label">Disponibles</h4>
                    <span className="stat-value">{countDisponibles}</span>
                </div>
            </div>

            {loading ? (
                <div className="skeleton" style={{ height: '300px', borderRadius: '20px' }}></div>
            ) : (
                ['Realizada', 'En Progreso', 'Disponible'].map(statusGroup => {
                    const groupItems = education.filter(edu => edu.status === statusGroup);
                    if (groupItems.length === 0) return null;

                    const getStatusColor = () => {
                        if (statusGroup === 'Realizada') return '#fff';
                        if (statusGroup === 'En Progreso') return 'var(--accent)';
                        return 'var(--text-secondary)';
                    };

                    return (
                        <div key={statusGroup} style={{ marginBottom: '2.5rem' }}>
                            <h3 className="text-truncate" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: getStatusColor() }}></div>
                                {statusGroup === 'Disponible' ? 'Disponibles' : statusGroup === 'En Progreso' ? 'En Progreso' : 'Completadas'}
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                {groupItems.map((edu) => (
                                    <div key={edu.id} className="glass-card fade-in" style={{ padding: '20px', borderLeft: `4px solid ${getStatusColor()}` }}>
                                        <div className="flex space-between align-start mb-1">
                                            <span className="badge">{edu.type}</span>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {canEdit(user?.role) && (
                                                    <button onClick={() => handleOpenEdit(edu)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                                        <Edit2 size={16} />
                                                    </button>
                                                )}
                                                {canDelete(user?.role) && (
                                                    <button onClick={() => handleDelete(edu.id, edu.title)} style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {edu.type === 'Certificación' ? <Award size={20} color="#FFD700" /> : <BookOpen size={20} color="var(--accent)" />}
                                            {edu.title}
                                        </h3>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{edu.institution} • {edu.year}</p>

                                        <button onClick={() => navigate(`/education/${edu.id}`)} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', gap: '8px' }}>
                                            {statusGroup === 'Disponible' ? 'Empezar' : statusGroup === 'En Progreso' ? 'Continuar' : 'Revisar'} <ExternalLink size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })
            )}

            {!loading && education.length === 0 && (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem 0' }}>No hay registros de formación.</p>
            )}

            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
                    <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '450px', padding: '32px' }}>
                        <div className="flex space-between align-center mb-2">
                            <h3 style={{ margin: 0, color: '#fff' }}>{editingItem ? 'Editar Educación' : 'Nuevo Registro'}</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>Título / Certificación</label>
                                <input required type="text" className="form-input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>Institución</label>
                                <input required type="text" className="form-input" value={formData.institution} onChange={e => setFormData({ ...formData, institution: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>Año</label>
                                    <input required type="text" className="form-input" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>Tipo</label>
                                    <select className="form-input" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })} style={{ appearance: 'auto' }}>
                                        <option value="Certificación">Certificación</option>
                                        <option value="Título">Título</option>
                                        <option value="Curso">Curso</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>Estado</label>
                                <select className="form-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })} style={{ appearance: 'auto' }}>
                                    <option value="Disponible">Disponible</option>
                                    <option value="En Progreso">En Progreso</option>
                                    <option value="Realizada">Realizada</option>
                                </select>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                                Guardar Registro
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Education;
