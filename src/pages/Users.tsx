import React, { useState, useEffect } from 'react';
import { getOrInitDB, logAction, User } from '../db/db';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Trash2, Search, X } from 'lucide-react';

const UsersManagement: React.FC = () => {
    const { user: authUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Consultor',
        title: ''
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const db = await getOrInitDB();
            const res = await db.exec({
                sql: "SELECT * FROM users ORDER BY id DESC",
                returnValue: 'resultRows'
            });
            setUsers(res || []);
        } catch (e) {
            console.error("Fetch Users Error:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const db = await getOrInitDB();
            await db.exec({
                sql: "INSERT INTO users (name, email, password, role, title) VALUES (?, ?, ?, ?, ?)",
                bind: [formData.name, formData.email, formData.password, formData.role, formData.title]
            });

            await logAction(authUser?.name || 'Sistema', 'Creó Usuario', 'Usuarios', `Creó: ${formData.name}`);
            setIsModalOpen(false);
            setFormData({ name: '', email: '', password: '', role: 'Consultor', title: '' });
            fetchUsers();
        } catch (e) {
            console.error("Create User Error:", e);
            alert("Error al crear usuario.");
        }
    };

    const handleDeleteUser = async (id: number, name: string) => {
        if (id === authUser?.id) return alert("No puedes eliminarte a ti mismo.");
        if (window.confirm(`¿Eliminar a ${name}?`)) {
            try {
                const db = await getOrInitDB();
                await db.exec({ sql: "DELETE FROM users WHERE id = ?", bind: [id] });
                await logAction(authUser?.name || 'Sistema', 'Eliminó Usuario', 'Usuarios', `Eliminó: ${name}`);
                fetchUsers();
            } catch (e) {
                console.error("Delete User Error:", e);
            }
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="skeleton" style={{ height: '400px', borderRadius: '20px' }}></div>;

    return (
        <div className="animate-fade-in">
            <div className="flex flex-wrap space-between align-center mb-2" style={{ gap: '16px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>Gestión de Consultores</h2>
                <button onClick={() => setIsModalOpen(true)} className="btn">
                    <UserPlus size={18} /> Nuevo Consultor
                </button>
            </div>

            <div className="glass-card mb-2" style={{ padding: '12px' }}>
                <div className="flex align-center gap-1" style={{ width: '100%' }}>
                    <Search size={20} style={{ color: 'var(--text-secondary)', marginLeft: '8px' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o correo..."
                        className="form-input"
                        style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {filteredUsers.map(u => (
                    <div key={u.id} className="glass-card fade-in" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{
                            width: 60, height: 60, borderRadius: '50%',
                            background: u.avatarBase64 ? `url(${u.avatarBase64}) center/cover` : 'linear-gradient(135deg, var(--accent), #fff)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '2px solid rgba(255,255,255,0.1)'
                        }}>
                            {!u.avatarBase64 && u.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 className="text-truncate" style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#fff' }}>{u.name}</h3>
                            <p className="badge" style={{ fontSize: '0.7rem', padding: '2px 8px', marginBottom: '8px' }}>{u.role}</p>
                            <p className="text-truncate" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>{u.email}</p>
                        </div>
                        <button onClick={() => handleDeleteUser(u.id, u.name)} className="btn-icon" style={{ color: '#ff6b6b' }}>
                            <Trash2 size={20} />
                        </button>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
                    <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '450px', padding: '32px' }}>
                        <div className="flex space-between align-center mb-2">
                            <h3 style={{ margin: 0, color: '#fff' }}>Nuevo Usuario</h3>
                            <button onClick={() => setIsModalOpen(false)} className="btn-icon"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <input required placeholder="Nombre Completo" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="form-input" />
                            <input required type="email" placeholder="Correo Electrónico" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="form-input" />
                            <input required type="password" placeholder="Contraseña Inicial" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="form-input" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="form-input" style={{ appearance: 'auto' }}>
                                    <option value="Consultor">Consultor</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Super admin">Super Admin</option>
                                </select>
                                <input placeholder="Título Cargo" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="form-input" />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>Crear Usuario</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersManagement;
