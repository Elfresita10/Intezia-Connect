import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Fundamental, getOrInitDB, logAction } from '../db/db';
import { canCreate, canEdit, canDelete } from '../utils/permissions';
import { Plus, Edit2, Trash2, ExternalLink, ChevronDown, ChevronRight, BookOpen, Layers, X } from 'lucide-react';

const Fundamentals: React.FC = () => {
    const { user } = useAuth();
    const [fundamentals, setFundamentals] = useState<Fundamental[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Fundamental | null>(null);
    const [formData, setFormData] = useState({
        type: 'Sistema Operativo',
        category: 'Recursos',
        title: '',
        description: '',
        url: ''
    });

    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    const toggleCategory = (catName: string) => {
        setExpandedCategories(prev => ({ ...prev, [catName]: !prev[catName] }));
    };

    const fetchFundamentals = async () => {
        setLoading(true);
        try {
            const db = await getOrInitDB();
            const rows = await db.exec({
                sql: 'SELECT * FROM fundamentals ORDER BY id ASC',
                returnValue: 'resultRows'
            });
            setFundamentals(rows || []);
        } catch (e) {
            console.error("Fetch Fundamentals Error:", e);
        } finally {
            setLoading(false);
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
                const db = await getOrInitDB();
                await db.exec({ sql: 'DELETE FROM fundamentals WHERE id = ?', bind: [id] });
                await logAction(user?.name || 'Sistema', 'Eliminó Fundamento', 'Fundamentos', `Eliminó: ${title}`);
                fetchFundamentals();
            } catch (e) {
                console.error("Delete Fundamental Error:", e);
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const db = await getOrInitDB();
            if (editingItem) {
                if (!canEdit(user?.role)) return;
                await db.exec({
                    sql: 'UPDATE fundamentals SET type = ?, category = ?, title = ?, description = ?, url = ? WHERE id = ?',
                    bind: [formData.type, formData.category, formData.title, formData.description, formData.url, editingItem.id]
                });
                await logAction(user?.name || 'Sistema', 'Actualizó Fundamento', 'Fundamentos', `Editó: ${formData.title}`);
            } else {
                if (!canCreate(user?.role)) return;
                await db.exec({
                    sql: 'INSERT INTO fundamentals (type, category, title, description, url) VALUES (?, ?, ?, ?, ?)',
                    bind: [formData.type, formData.category, formData.title, formData.description, formData.url]
                });
                await logAction(user?.name || 'Sistema', 'Creó Fundamento', 'Fundamentos', `Creó: ${formData.title}`);
            }
            setIsModalOpen(false);
            fetchFundamentals();
        } catch (e) {
            console.error("Save Fundamental Error:", e);
            alert("Error al guardar.");
        }
    };

    const grouped = fundamentals.reduce((acc, curr) => {
        if (!acc[curr.type]) acc[curr.type] = {};
        if (!acc[curr.type][curr.category]) acc[curr.type][curr.category] = [];
        acc[curr.type][curr.category].push(curr);
        return acc;
    }, {} as Record<string, Record<string, Fundamental[]>>);

    const types = Object.keys(grouped);

    if (loading) return <div className="skeleton" style={{ height: '400px', borderRadius: '20px' }}></div>;

    return (
        <div className="animate-fade-in relative" style={{ paddingBottom: '3rem' }}>
            <div className="flex flex-wrap space-between align-center mb-2" style={{ gap: '16px' }}>
                <div>
                    <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <BookOpen size={28} /> Fundamentos Corporativos
                    </h2>
                </div>
                {canCreate(user?.role) && (
                    <button onClick={handleOpenCreate} className="btn">
                        <Plus size={18} /> Nuevo Recurso
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {types.map(type => (
                    <div key={type} className="glass-card" style={{ padding: '24px' }}>
                        <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                            <Layers size={20} color="var(--accent)" /> {type}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {Object.keys(grouped[type]).map(category => {
                                const isExpanded = expandedCategories[`${type}-${category}`] !== false;
                                const items = grouped[type][category];

                                return (
                                    <div key={category} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
                                        <div
                                            onClick={() => toggleCategory(`${type}-${category}`)}
                                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', cursor: 'pointer', background: 'rgba(255,255,255,0.03)' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {isExpanded ? <ChevronDown size={18} color="var(--accent)" /> : <ChevronRight size={18} />}
                                                <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>{category}</h4>
                                                <span className="badge" style={{ fontSize: '0.7rem' }}>{items.length}</span>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {items.map((item) => (
                                                    <div key={item.id} className="glass-card" style={{ padding: '12px', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)' }}>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <h5 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#fff' }}>{item.title}</h5>
                                                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.description}</p>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                                                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }}>
                                                                <ExternalLink size={14} /> Abrir
                                                            </a>
                                                            {canEdit(user?.role) && (
                                                                <button onClick={() => handleOpenEdit(item)} className="btn-icon">
                                                                    <Edit2 size={14} />
                                                                </button>
                                                            )}
                                                            {canDelete(user?.role) && (
                                                                <button onClick={() => handleDelete(item.id, item.title)} className="btn-icon" style={{ color: '#ff6b6b' }}>
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
                    <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '450px', padding: '32px' }}>
                        <div className="flex space-between align-center mb-2">
                            <h3 style={{ margin: 0, color: '#fff' }}>{editingItem ? 'Editar Recurso' : 'Nuevo Recurso'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="btn-icon">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tipo</label>
                                    <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="form-input" style={{ appearance: 'auto' }}>
                                        <option value="Sistema Operativo">Sistema Operativo</option>
                                        <option value="Procesos">Procesos</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Categoría</label>
                                    <input required type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="form-input" />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Título</label>
                                <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="form-input" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Descripción</label>
                                <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="form-input" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>URL</label>
                                <input required type="url" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} className="form-input" />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                                Guardar Fundamento
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Fundamentals;
