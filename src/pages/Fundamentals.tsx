import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Fundamental, getDb, logAction } from '../db/db';
import { canCreate, canEdit, canDelete } from '../utils/permissions';
import { Plus, Edit2, Trash2, ExternalLink, ChevronDown, ChevronRight, BookOpen, Layers, X } from 'lucide-react';

const Fundamentals: React.FC = () => {
    const { user } = useAuth();
    const [fundamentals, setFundamentals] = useState<Fundamental[]>([]);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Fundamental | null>(null);
    const [formData, setFormData] = useState({
        type: 'Sistema Operativo',
        category: 'Recursos',
        title: '',
        description: '',
        url: ''
    });

    // To control expanded accordion categories
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    const toggleCategory = (catName: string) => {
        setExpandedCategories(prev => ({ ...prev, [catName]: !prev[catName] }));
    };

    const fetchFundamentals = async () => {
        try {
            const db = getDb();
            const rows = await db.exec({ sql: 'SELECT * FROM fundamentals', returnValue: 'resultRows', rowMode: 'object' });
            setFundamentals(rows as unknown as Fundamental[]);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchFundamentals();
    }, []);

    const handleOpenCreate = () => {
        if (!canCreate(user?.role)) return;
        setEditingItem(null);
        setFormData({ type: 'Sistema Operativo', category: 'Recursos', title: '', description: '', url: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item: Fundamental) => {
        if (!canEdit(user?.role)) return;
        setEditingItem(item);
        setFormData({ type: item.type, category: item.category, title: item.title, description: item.description, url: item.url });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number, title: string) => {
        if (!canDelete(user?.role)) return;
        if (window.confirm('¿Seguro que deseas eliminar este proceso?')) {
            try {
                const db = getDb();
                await db.exec({ sql: 'DELETE FROM fundamentals WHERE id = ?', bind: [id] });
                await logAction(user?.name || 'Desconocido', 'Eliminó', 'Fundamentos', `Eliminó el proceso: ${title}`);
                fetchFundamentals();
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const db = getDb();
            if (editingItem) {
                if (!canEdit(user?.role)) return;
                await db.exec({
                    sql: 'UPDATE fundamentals SET type = ?, category = ?, title = ?, description = ?, url = ? WHERE id = ?',
                    bind: [formData.type, formData.category, formData.title, formData.description, formData.url, editingItem.id]
                });
                await logAction(user?.name || 'Desconocido', 'Editó', 'Fundamentos', `Editó proceso: ${formData.title}`);
            } else {
                if (!canCreate(user?.role)) return;
                await db.exec({
                    sql: 'INSERT INTO fundamentals (type, category, title, description, url) VALUES (?, ?, ?, ?, ?)',
                    bind: [formData.type, formData.category, formData.title, formData.description, formData.url]
                });
                await logAction(user?.name || 'Desconocido', 'Creó', 'Fundamentos', `Añadió nuevo proceso: ${formData.title}`);
            }
            setIsModalOpen(false);
            fetchFundamentals();
        } catch (e) {
            console.error(e);
        }
    };

    // Grouping by Type and then Category
    const grouped = fundamentals.reduce((acc, curr) => {
        if (!acc[curr.type]) acc[curr.type] = {};
        if (!acc[curr.type][curr.category]) acc[curr.type][curr.category] = [];
        acc[curr.type][curr.category].push(curr);
        return acc;
    }, {} as Record<string, Record<string, Fundamental[]>>);

    const types = Object.keys(grouped);

    return (
        <div className="animate-fade-in relative" style={{ paddingBottom: '3rem' }}>
            <div className="flex space-between align-center mb-2">
                <div>
                    <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <BookOpen size={32} style={{ color: 'var(--accent)' }} /> Fundamentos
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Base de conocimiento de procesos y manuales del sistema
                    </p>
                </div>
                {canCreate(user?.role) && (
                    <button onClick={handleOpenCreate} className="btn" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                        <Plus size={16} /> Nuevo Proceso
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1.5rem' }}>
                {types.map(type => (
                    <div key={type} className="glass-card" style={{ padding: '30px' }}>
                        <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
                            <Layers size={22} style={{ color: 'var(--accent)' }} /> {type}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {Object.keys(grouped[type]).map(category => {
                                const isExpanded = expandedCategories[`${type}-${category}`] !== false; // Default true
                                const items = grouped[type][category];

                                return (
                                    <div key={category} style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden', background: 'rgba(255,255,255,0.02)', marginBottom: '12px' }}>
                                        <div
                                            onClick={() => toggleCategory(`${type}-${category}`)}
                                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', cursor: 'pointer', background: 'rgba(255,255,255,0.03)' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {isExpanded ? <ChevronDown size={20} color="var(--accent)" /> : <ChevronRight size={20} />}
                                                <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>{category}</h4>
                                                <span className="badge" style={{ marginLeft: '8px' }}>{items.length}</span>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div style={{ padding: '0 1rem 1rem 1rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                    {items.map((item, idx) => (
                                                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', background: 'var(--bg-color)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.02)' }}>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', opacity: 0.6, width: '20px' }}>{idx + 1}.</span>
                                                                    <h5 style={{ margin: 0, fontSize: '0.95rem', color: '#e6edf3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h5>
                                                                </div>
                                                                <p style={{ margin: '0 0 0 32px', fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {item.description}
                                                                </p>
                                                            </div>

                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '16px' }}>
                                                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', letterSpacing: 0 }}>
                                                                    <ExternalLink size={14} /> Abrir
                                                                </a>
                                                                {canEdit(user?.role) && (
                                                                    <button onClick={() => handleOpenEdit(item)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.4rem', display: 'flex' }} title="Editar">
                                                                        <Edit2 size={14} />
                                                                    </button>
                                                                )}
                                                                {canDelete(user?.role) && (
                                                                    <button onClick={() => handleDelete(item.id, item.title)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#ff6b6b', cursor: 'pointer', padding: '0.4rem', display: 'flex' }} title="Eliminar">
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {types.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>No hay procesos fundamentales registrados aún.</p>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
                    <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '450px', position: 'relative', background: '#121212', padding: '30px' }}>
                        <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: 0.6 }}>
                            <X size={28} />
                        </button>
                        <h3 style={{ margin: '0 0 20px', color: '#fff', fontSize: '1.5rem', fontWeight: 700 }}>{editingItem ? 'Editar Proceso' : 'Añadir Nuevo Proceso'}</h3>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Tipo Principal</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: '#fff' }}
                                        required
                                    >
                                        <option value="Sistema Operativo">Sistema Operativo</option>
                                        <option value="Procesos">Procesos</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Categoría</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        placeholder="Ej. Recursos, Formularios..."
                                        style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: '#fff' }}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Título / Nombre</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: '#fff' }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Descripción Corta</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: '#fff' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>URL del Enlace (GDocs, Airtable, etc)</label>
                                <input
                                    type="url"
                                    value={formData.url}
                                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                                    placeholder="https://..."
                                    style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: '#fff' }}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn" style={{ flex: 1, justifyContent: 'center', background: 'transparent', border: '1px solid var(--border-color)' }}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Fundamentals;
