import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle, FileText, Plus, Trash2, X, GraduationCap } from 'lucide-react';
import { getOrInitDB, logAction, Education as EducationItem, CourseModule, CourseResource } from '../db/db';
import { useAuth } from '../context/AuthContext';
import { canCreate, canDelete } from '../utils/permissions';

const EducationDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [course, setCourse] = useState<EducationItem | null>(null);
    const [modules, setModules] = useState<CourseModule[]>([]);
    const [resources, setResources] = useState<CourseResource[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeVideoIndex, setActiveVideoIndex] = useState(0);
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);

    const [moduleFormData, setModuleFormData] = useState({ title: '', video_url: '' });
    const [resourceFormData, setResourceFormData] = useState({ name: '', url: '' });

    const fetchCourseData = async () => {
        try {
            const db = await getOrInitDB();
            const courseRows = await db.exec({
                sql: 'SELECT * FROM education WHERE id = ?',
                bind: [id],
                returnValue: 'resultRows'
            });
            if (courseRows && courseRows.length > 0) {
                setCourse(courseRows[0] as unknown as EducationItem);
            }

            const moduleRows = await db.exec({
                sql: 'SELECT * FROM course_modules WHERE education_id = ? ORDER BY id ASC',
                bind: [id],
                returnValue: 'resultRows'
            });
            setModules(moduleRows || []);

            const resourceRows = await db.exec({
                sql: 'SELECT * FROM course_resources WHERE education_id = ? ORDER BY id ASC',
                bind: [id],
                returnValue: 'resultRows'
            });
            setResources(resourceRows || []);
        } catch (e) {
            console.error("Fetch Education Details Error:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchCourseData();
    }, [id]);

    const handleSaveModule = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const db = await getOrInitDB();
            await db.exec({
                sql: 'INSERT INTO course_modules (education_id, title, video_url) VALUES (?, ?, ?)',
                bind: [id, moduleFormData.title, moduleFormData.video_url]
            });
            await logAction(user?.name || 'Sistema', 'Añadió Módulo', 'Educación', `Añadió clase: ${moduleFormData.title}`);
            setIsModuleModalOpen(false);
            setModuleFormData({ title: '', video_url: '' });
            fetchCourseData();
        } catch (e) { console.error(e); }
    };

    const handleDeleteModule = async (moduleId: number, title: string) => {
        if (!canDelete(user?.role)) return;
        if (window.confirm(`¿Eliminar clase ${title}?`)) {
            try {
                const db = await getOrInitDB();
                await db.exec({ sql: 'DELETE FROM course_modules WHERE id = ?', bind: [moduleId] });
                await logAction(user?.name || 'Sistema', 'Eliminó Módulo', 'Educación', `Eliminó clase: ${title}`);
                fetchCourseData();
            } catch (e) { console.error(e); }
        }
    };

    const handleSaveResource = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const db = await getOrInitDB();
            await db.exec({
                sql: 'INSERT INTO course_resources (education_id, name, url) VALUES (?, ?, ?)',
                bind: [id, resourceFormData.name, resourceFormData.url]
            });
            await logAction(user?.name || 'Sistema', 'Añadió Recurso', 'Educación', `Añadió recurso: ${resourceFormData.name}`);
            setIsResourceModalOpen(false);
            setResourceFormData({ name: '', url: '' });
            fetchCourseData();
        } catch (e) { console.error(e); }
    };

    const handleDeleteResource = async (resourceId: number, name: string) => {
        if (!canDelete(user?.role)) return;
        if (window.confirm(`¿Eliminar recurso ${name}?`)) {
            try {
                const db = await getOrInitDB();
                await db.exec({ sql: 'DELETE FROM course_resources WHERE id = ?', bind: [resourceId] });
                await logAction(user?.name || 'Sistema', 'Eliminó Recurso', 'Educación', `Eliminó recurso: ${name}`);
                fetchCourseData();
            } catch (e) { console.error(e); }
        }
    };

    if (loading) return <div className="skeleton" style={{ height: '400px', borderRadius: '20px' }}></div>;
    if (!course) return <div className="p-4" style={{ textAlign: 'center' }}>Formación no encontrada.</div>;

    const currentModule = modules[activeVideoIndex];

    return (
        <div className="animate-fade-in relative">
            <button onClick={() => navigate('/education')} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '1.5rem', padding: 0 }}>
                <ArrowLeft size={16} /> Volver a Formación
            </button>

            <div className="mb-2">
                <h2 style={{ fontSize: '1.8rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <GraduationCap size={28} color="var(--accent)" /> {course.title}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{course.institution} • {course.type}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 3fr)', gap: '20px', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {modules.length > 0 && currentModule ? (
                        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
                                <PlayCircle size={64} color="var(--accent)" style={{ opacity: 0.8 }} />
                                <h4 style={{ color: '#fff', fontSize: '1.2rem', textAlign: 'center', padding: '0 20px' }}>{currentModule.title}</h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Enlace: {currentModule.video_url}</p>
                            </div>
                            <div style={{ padding: '24px' }}>
                                <h3 style={{ margin: 0, color: '#fff' }}>{currentModule.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Módulo {activeVideoIndex + 1} de {modules.length}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', opacity: 0.5 }}>
                            <PlayCircle size={48} style={{ marginBottom: '1rem' }} />
                            <p>No hay videos registrados para esta formación.</p>
                        </div>
                    )}

                    <div className="glass-card" style={{ padding: '24px' }}>
                        <div className="flex space-between align-center mb-2">
                            <h3 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FileText size={20} color="var(--accent)" /> Material de Apoyo
                            </h3>
                            {canCreate(user?.role) && (
                                <button onClick={() => setIsResourceModalOpen(true)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                                    <Plus size={14} /> Añadir Recurso
                                </button>
                            )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                            {resources.map(res => (
                                <div key={res.id} className="glass-card" style={{ padding: '16px', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)' }}>
                                    <a href={res.url} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', fontSize: '0.9rem', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis' }}>{res.name}</a>
                                    {canDelete(user?.role) && (
                                        <button onClick={() => handleDeleteResource(res.id, res.name)} className="btn-icon" style={{ color: '#ff6b6b' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {resources.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No hay recursos adicionales.</p>}
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, color: '#fff' }}>Plan de Estudios</h4>
                        {canCreate(user?.role) && (
                            <button onClick={() => setIsModuleModalOpen(true)} className="btn-icon" style={{ color: 'var(--accent)' }}><Plus size={20} /></button>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {modules.map((mod, idx) => (
                            <div
                                key={mod.id}
                                onClick={() => setActiveVideoIndex(idx)}
                                style={{
                                    padding: '16px 20px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)',
                                    background: idx === activeVideoIndex ? 'rgba(88,166,255,0.08)' : 'transparent',
                                    borderLeft: idx === activeVideoIndex ? '4px solid var(--accent)' : '4px solid transparent',
                                }}
                            >
                                <div className="flex space-between align-center">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.75rem', color: idx === activeVideoIndex ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 700 }}>CLASE {idx + 1}</span>
                                        <span style={{ fontSize: '0.9rem', color: idx === activeVideoIndex ? '#fff' : 'rgba(255,255,255,0.8)' }}>{mod.title}</span>
                                    </div>
                                    {canDelete(user?.role) && (
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteModule(mod.id, mod.title); }} className="btn-icon" style={{ color: '#ff6b6b', opacity: 0.5 }}><Trash2 size={14} /></button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {isModuleModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
                    <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '450px', padding: '32px' }}>
                        <div className="flex space-between align-center mb-2">
                            <h3 style={{ margin: 0, color: '#fff' }}>Nueva Clase</h3>
                            <button onClick={() => setIsModuleModalOpen(false)} className="btn-icon"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSaveModule} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <input required placeholder="Título de la clase" value={moduleFormData.title} onChange={e => setModuleFormData({ ...moduleFormData, title: e.target.value })} className="form-input" />
                            <input required placeholder="URL del video" value={moduleFormData.video_url} onChange={e => setModuleFormData({ ...moduleFormData, video_url: e.target.value })} className="form-input" />
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>Guardar Clase</button>
                        </form>
                    </div>
                </div>
            )}

            {isResourceModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
                    <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '450px', padding: '32px' }}>
                        <div className="flex space-between align-center mb-2">
                            <h3 style={{ margin: 0, color: '#fff' }}>Nuevo Recurso</h3>
                            <button onClick={() => setIsResourceModalOpen(false)} className="btn-icon"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSaveResource} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <input required placeholder="Nombre del recurso" value={resourceFormData.name} onChange={e => setResourceFormData({ ...resourceFormData, name: e.target.value })} className="form-input" />
                            <input required placeholder="URL de descarga" value={resourceFormData.url} onChange={e => setResourceFormData({ ...resourceFormData, url: e.target.value })} className="form-input" />
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>Añadir Material</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EducationDetails;
