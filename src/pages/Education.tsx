import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, BookOpen, ExternalLink, Edit2, Trash2, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { canCreate, canEdit, canDelete } from '../utils/permissions';
import { getDb, logAction, Education as EducationItem } from '../db/db';
import { NotificationService } from '../utils/NotificationService';

const Education: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [education, setEducation] = useState<EducationItem[]>([]);

    // Modal State
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
        try {
            const db = getDb();
            const rows = await db.exec({ sql: 'SELECT * FROM education', returnValue: 'resultRows', rowMode: 'object' });
            setEducation(rows as unknown as EducationItem[]);
        } catch (e) { console.error(e); }
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
        if (window.confirm('¿Seguro que deseas eliminar este registro?')) {
            try {
                const db = getDb();
                await db.exec({ sql: 'DELETE FROM education WHERE id = ?', bind: [id] });
                await logAction(user?.name || 'Desconocido', 'Eliminó', 'Educación', `Eliminó el registro: ${title}`);
                fetchEducation();
            } catch (e) { console.error(e); }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const db = getDb();
            if (editingItem) {
                if (!canEdit(user?.role)) return;
                await db.exec({
                    sql: 'UPDATE education SET title = ?, institution = ?, year = ?, type = ?, status = ? WHERE id = ?',
                    bind: [formData.title, formData.institution, formData.year, formData.type, formData.status, editingItem.id]
                });
                await logAction(user?.name || 'Desconocido', 'Editó', 'Educación', `Actualizó registro de formación: ${formData.title}`);
            } else {
                if (!canCreate(user?.role)) return;
                await db.exec({
                    sql: 'INSERT INTO education (title, institution, year, type, status) VALUES (?, ?, ?, ?, ?)',
                    bind: [formData.title, formData.institution, formData.year, formData.type, formData.status]
                });
                await logAction(user?.name || 'Desconocido', 'Creó', 'Educación', `Añadió un nuevo registro de formación: ${formData.title}`);

                // Trigger local notification
                NotificationService.sendLocalNotification('Nueva Capacitación disponible', {
                    body: `Se ha añadido: ${formData.title}`,
                    tag: 'new-education'
                });
            }
            setIsModalOpen(false);
            fetchEducation();
        } catch (e) { console.error(e); }
    };

    // Calculate Counts for Top Cards
    const countRealizadas = education.filter(e => e.status === 'Realizada').length;
    const countEnProgreso = education.filter(e => e.status === 'En Progreso').length;
    const countDisponibles = education.filter(e => e.status === 'Disponible').length;

    return (
        <div className="animate-fade-in relative">
            <div className="flex flex-wrap space-between align-center mb-2" style={{ gap: '12px' }}>
                <h2 className="section-title text-truncate" style={{ margin: 0, flex: 1, minWidth: '150px' }}>Formación</h2>
                {canCreate(user?.role) && (
                    <button onClick={handleOpenCreate} className="btn" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                        <Plus size={16} /> Nueva
                    </button>
                )}
            </div>

            {/* Top Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="glass-card stat-card" style={{ margin: 0, borderTop: '4px solid #fff', padding: '15px' }}>
                    <h4 className="stat-label">Realizadas</h4>
                    <span className="stat-value">{countRealizadas}</span>
                </div>
                <div className="glass-card stat-card" style={{ margin: 0, borderTop: '4px solid var(--accent)' }}>
                    <h4 className="stat-label">En Progreso</h4>
                    <span className="stat-value">{countEnProgreso}</span>
                </div>
                <div className="glass-card stat-card" style={{ margin: 0, borderTop: '4px solid rgba(255,255,255,0.2)' }}>
                    <h4 className="stat-label">Disponibles</h4>
                    <span className="stat-value">{countDisponibles}</span>
                </div>
            </div>

            {/* Lists Grouped By Status */}
            {['Realizada', 'En Progreso', 'Disponible'].map(statusGroup => {
                const groupItems = education.filter(edu => edu.status === statusGroup);
                if (groupItems.length === 0) return null;

                const getDotColor = () => {
                    if (statusGroup === 'Realizada') return '#fff';
                    if (statusGroup === 'En Progreso') return 'var(--accent)';
                    return 'var(--text-secondary)';
                };

                return (
                    <div key={statusGroup} style={{ marginBottom: '2.5rem' }}>
                        <h3 className="text-truncate" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: getDotColor(), flexShrink: 0 }}></div>
                            {statusGroup === 'Disponible' ? 'Disponibles' : statusGroup === 'En Progreso' ? 'En Progreso' : 'Realizadas'}
                        </h3>
                        <div style={{ position: 'relative', paddingLeft: '24px', paddingTop: '8px' }}>
                            <div style={{ position: 'absolute', left: '11px', top: '0', bottom: '0', width: '2px', background: 'var(--border-color)' }}></div>

                            {groupItems.map((edu) => (
                                <div key={edu.id} style={{ position: 'relative', marginBottom: '2rem' }}>
                                    <div style={{ position: 'absolute', left: '-29px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: getDotColor(), border: '2px solid var(--bg-color)' }}></div>

                                    <div
                                        className="glass-card"
                                        style={{ marginBottom: '1rem', padding: '16px', position: 'relative', borderLeft: '4px solid var(--accent)' }}
                                    >
                                        <div className="flex space-between align-center mb-1">
                                            <span className="badge">
                                                {edu.type}
                                            </span>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{edu.year}</span>
                                                {canEdit(user?.role) && (
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <button onClick={() => handleOpenEdit(edu)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem' }} title="Editar">
                                                            <Edit2 size={14} />
                                                        </button>
                                                        {canDelete(user?.role) && (
                                                            <button onClick={() => handleDelete(edu.id, edu.title)} style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: '0.2rem' }} title="Eliminar">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <h3 className="text-truncate" style={{ fontSize: '1.1rem', margin: '0.5rem 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {edu.type === 'Certificación' ? <Award size={18} style={{ flexShrink: 0, color: '#d29922' }} /> : <BookOpen size={18} style={{ flexShrink: 0, color: 'var(--accent)' }} />}
                                            <span className="text-truncate">{edu.title}</span>
                                        </h3>

                                        <p className="text-truncate" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>{edu.institution}</p>

                                        <button onClick={() => navigate(`/education/${edu.id}`)} className="btn" style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', boxShadow: 'none', width: '100%', justifyContent: 'center', gap: '8px' }}>
                                            {statusGroup === 'Disponible' ? 'Empezar Capacitación' :
                                                statusGroup === 'En Progreso' ? 'Continuar' :
                                                    'Ver Certificado'} <ExternalLink size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {education.length === 0 && <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No hay registros disponibles.</p>}

            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
                    <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '450px', position: 'relative', background: '#121212', padding: '30px' }}>
                        <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: 0.6 }}>
                            <X size={28} />
                        </button>
                        <h3 style={{ margin: '0 0 20px', color: '#fff', fontSize: '1.5rem', fontWeight: 700 }}>{editingItem ? 'Editar Educación' : 'Nueva Educación'}</h3>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Título / Certificado</label>
                                <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="form-input" style={{ width: '100%', padding: '0.6rem', marginTop: '0.2rem' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Institución</label>
                                <input required type="text" value={formData.institution} onChange={e => setFormData({ ...formData, institution: e.target.value })} className="form-input" style={{ width: '100%', padding: '0.6rem', marginTop: '0.2rem' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Año</label>
                                    <input required type="text" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} className="form-input" style={{ width: '100%', padding: '0.6rem', marginTop: '0.2rem' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tipo</label>
                                    <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })} className="form-input" style={{ width: '100%', padding: '0.6rem', marginTop: '0.2rem', appearance: 'auto' }}>
                                        <option value="Certificación">Certificación</option>
                                        <option value="Título">Título</option>
                                        <option value="Curso">Curso</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estado de Formación</label>
                                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="form-input" style={{ width: '100%', padding: '0.6rem', marginTop: '0.2rem', appearance: 'auto' }}>
                                    <option value="Disponible">Disponible (Catálogo Abierto)</option>
                                    <option value="En Progreso">En Progreso (Cursando)</option>
                                    <option value="Realizada">Realizada (Finalizada)</option>
                                </select>
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

export default Education;
