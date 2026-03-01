import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle, FileText, Plus, Trash2, X, GraduationCap } from 'lucide-react';
import { getDb, logAction, Education as EducationItem, CourseModule, CourseResource } from '../db/db';
import { useAuth } from '../context/AuthContext';
import { canCreate, canDelete } from '../utils/permissions';

const EducationDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [course, setCourse] = useState<EducationItem | null>(null);
    const [modules, setModules] = useState<CourseModule[]>([]);
    const [resources, setResources] = useState<CourseResource[]>([]);

    // UI State
    const [activeVideoIndex, setActiveVideoIndex] = useState(0);

    // Modal State
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);

    const [moduleFormData, setModuleFormData] = useState({ title: '', video_url: '' });
    const [resourceFormData, setResourceFormData] = useState({ name: '', url: '' });

    const fetchCourseData = async () => {
        try {
            const db = getDb();
            const courseRows = await db.exec({ sql: 'SELECT * FROM education WHERE id = ?', bind: [id], returnValue: 'resultRows', rowMode: 'object' });
            if (courseRows.length > 0) {
                setCourse(courseRows[0] as unknown as EducationItem);
            }

            const moduleRows = await db.exec({ sql: 'SELECT * FROM course_modules WHERE education_id = ?', bind: [id], returnValue: 'resultRows', rowMode: 'object' });
            setModules(moduleRows as unknown as CourseModule[]);

            const resourceRows = await db.exec({ sql: 'SELECT * FROM course_resources WHERE education_id = ?', bind: [id], returnValue: 'resultRows', rowMode: 'object' });
            setResources(resourceRows as unknown as CourseResource[]);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchCourseData();
    }, [id]);

    // Module Actions
    const handleSaveModule = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const db = getDb();
            await db.exec({
                sql: 'INSERT INTO course_modules (education_id, title, video_url) VALUES (?, ?, ?)',
                bind: [id, moduleFormData.title, moduleFormData.video_url]
            });
            await logAction(user?.name || 'Desconocido', 'Añadió', 'Módulo de Curso', `Agregó la clase: ${moduleFormData.title}`);
            setIsModuleModalOpen(false);
            setModuleFormData({ title: '', video_url: '' });
            fetchCourseData();
        } catch (e) { console.error(e); }
    };

    const handleDeleteModule = async (moduleId: number, title: string) => {
        if (window.confirm('¿Seguro que deseas eliminar esta clase?')) {
            try {
                const db = getDb();
                await db.exec({ sql: 'DELETE FROM course_modules WHERE id = ?', bind: [moduleId] });
                await logAction(user?.name || 'Desconocido', 'Eliminó', 'Módulo de Curso', `Eliminó la clase: ${title}`);
                if (activeVideoIndex >= modules.length - 1) setActiveVideoIndex(0);
                fetchCourseData();
            } catch (e) { console.error(e); }
        }
    };

    // Resource Actions
    const handleSaveResource = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const db = getDb();
            await db.exec({
                sql: 'INSERT INTO course_resources (education_id, name, url) VALUES (?, ?, ?)',
                bind: [id, resourceFormData.name, resourceFormData.url]
            });
            await logAction(user?.name || 'Desconocido', 'Añadió', 'Recurso de Curso', `Adjuntó el archivo: ${resourceFormData.name}`);
            setIsResourceModalOpen(false);
            setResourceFormData({ name: '', url: '' });
            fetchCourseData();
        } catch (e) { console.error(e); }
    };

    const handleDeleteResource = async (resourceId: number, name: string) => {
        if (window.confirm('¿Seguro que deseas eliminar este recurso?')) {
            try {
                const db = getDb();
                await db.exec({ sql: 'DELETE FROM course_resources WHERE id = ?', bind: [resourceId] });
                await logAction(user?.name || 'Desconocido', 'Eliminó', 'Recurso de Curso', `Eliminó el archivo: ${name}`);
                fetchCourseData();
            } catch (e) { console.error(e); }
        }
    };

    if (!course) return <div className="p-4">Cargando curso...</div>;

    const currentModule = modules[activeVideoIndex];

    return (
        <div className="animate-fade-in relative" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div>
                <button onClick={() => navigate('/education')} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '1rem', padding: 0 }}>
                    <ArrowLeft size={16} /> Volver a Formación
                </button>
                <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <GraduationCap size={28} color="var(--accent)" />
                    {course.title}
                </h2>
                <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <span className="badge" style={{ background: 'var(--bg-surface-glass)', color: '#fff', border: '1px solid var(--border-color)' }}>{course.type}</span>
                    <span style={{ display: 'flex', alignItems: 'center' }}>•</span>
                    <span style={{ display: 'flex', alignItems: 'center' }}>{course.institution}</span>
                </div>
            </div>

            {/* Layout a dos columnas para Video y Temario */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 3fr)', gap: '1.5rem', alignItems: 'start' }}>

                {/* Columna Izquierda: Reproductor de Video */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {modules.length > 0 && currentModule ? (
                        <>
                            <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '12px', overflow: 'hidden', position: 'relative', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }}>
                                {/* Placeholder cinemático para simular el video. Si fuese real, aquí iría un <iframe> o <video> con currentModule.video_url */}
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #161b22, #0d1117)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <PlayCircle size={64} color="var(--accent)" style={{ opacity: 0.8, marginBottom: '1rem' }} />
                                    <p style={{ color: '#fff', fontSize: '1.1rem', margin: 0 }}>Reproduciendo:</p>
                                    <p style={{ color: 'var(--accent)', fontSize: '1.3rem', fontWeight: 'bold', margin: '0.5rem 0', textAlign: 'center', maxWidth: '80%' }}>{currentModule.title}</p>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', opacity: 0.7 }}>[{currentModule.video_url}]</p>
                                </div>
                            </div>
                            <div className="card" style={{ padding: '1.5rem', margin: 0 }}>
                                <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.4rem' }}>{currentModule.title}</h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Módulo {activeVideoIndex + 1} de {modules.length}</p>
                            </div>
                        </>
                    ) : (
                        <div className="card" style={{ padding: '4rem 2rem', margin: 0, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <PlayCircle size={48} color="var(--text-secondary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                            <h3 style={{ color: '#fff', margin: '0 0 0.5rem 0' }}>El curso aún no tiene clases</h3>
                            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>El administrador debe agregar módulos para visualizar el contenido.</p>
                        </div>
                    )}
                </div>

                {/* Columna Derecha: Temario (Curriculum) */}
                <div className="card" style={{ margin: 0, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>Contenido del Curso</h3>
                        {canCreate(user?.role) && (
                            <button onClick={() => setIsModuleModalOpen(true)} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '0.2rem' }} title="Añadir Clase">
                                <Plus size={18} />
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '500px', overflowY: 'auto' }}>
                        {modules.map((mod, idx) => (
                            <div
                                key={mod.id}
                                onClick={() => setActiveVideoIndex(idx)}
                                style={{
                                    padding: '1rem 1.25rem',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid var(--border-color)',
                                    background: idx === activeVideoIndex ? 'rgba(88,166,255,0.1)' : 'transparent',
                                    borderLeft: idx === activeVideoIndex ? '4px solid var(--accent)' : '4px solid transparent',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start'
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '0.8rem', color: idx === activeVideoIndex ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 'bold' }}>Clase {idx + 1}</span>
                                    <span style={{ fontSize: '0.95rem', color: idx === activeVideoIndex ? '#fff' : 'var(--text-primary)' }}>{mod.title}</span>
                                </div>

                                {canDelete(user?.role) && (
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteModule(mod.id, mod.title); }} style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: '0.2rem', opacity: idx === activeVideoIndex ? 1 : 0.5 }} title="Eliminar Clase">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                        {modules.length === 0 && (
                            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                Vacío.
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Fila Inferior: Recursos Descargables */}
            <div className="card" style={{ margin: 0, padding: '1.5rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={20} color="var(--accent)" />
                        Recursos Descargables
                    </h3>
                    {canCreate(user?.role) && (
                        <button onClick={() => setIsResourceModalOpen(true)} className="badge" style={{ cursor: 'pointer', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', color: 'var(--text-primary)' }}>
                            <Plus size={14} /> Añadir Archivo
                        </button>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {resources.map((res) => (
                        <div key={res.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-surface-glass)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                                <FileText size={18} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                                <a href={res.url !== '#' ? res.url : undefined} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {res.name}
                                </a>
                            </div>
                            {canDelete(user?.role) && (
                                <button onClick={() => handleDeleteResource(res.id, res.name)} style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: '4px' }}>
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                    {resources.length === 0 && <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No hay recursos adjuntos a esta formación.</p>}
                </div>
            </div>

            {/* Modals de Admin */}
            {isModuleModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '400px', position: 'relative' }}>
                        <button onClick={() => setIsModuleModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                        <h3 style={{ margin: '0 0 1.5rem', color: '#fff' }}>Añadir Nueva Clase</h3>
                        <form onSubmit={handleSaveModule} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Título del Módulo/Clase</label>
                                <input required type="text" value={moduleFormData.title} onChange={e => setModuleFormData({ ...moduleFormData, title: e.target.value })} className="form-input" style={{ width: '100%', padding: '0.6rem', marginTop: '0.2rem' }} placeholder="Ej: 1. Introducción..." />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>URL del Video</label>
                                <input required type="text" value={moduleFormData.video_url} onChange={e => setModuleFormData({ ...moduleFormData, video_url: e.target.value })} className="form-input" style={{ width: '100%', padding: '0.6rem', marginTop: '0.2rem' }} placeholder="https://..." />
                            </div>
                            <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                                Guardar Clase
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isResourceModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '400px', position: 'relative' }}>
                        <button onClick={() => setIsResourceModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                        <h3 style={{ margin: '0 0 1.5rem', color: '#fff' }}>Añadir Recurso</h3>
                        <form onSubmit={handleSaveResource} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nombre del Archivo</label>
                                <input required type="text" value={resourceFormData.name} onChange={e => setResourceFormData({ ...resourceFormData, name: e.target.value })} className="form-input" style={{ width: '100%', padding: '0.6rem', marginTop: '0.2rem' }} placeholder="Ej: Diapositivas Semana 1.pdf" />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Enlace de Descarga</label>
                                <input required type="text" value={resourceFormData.url} onChange={e => setResourceFormData({ ...resourceFormData, url: e.target.value })} className="form-input" style={{ width: '100%', padding: '0.6rem', marginTop: '0.2rem' }} placeholder="https://..." />
                            </div>
                            <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                                Guardar Recurso
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EducationDetails;
