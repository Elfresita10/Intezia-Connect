import React, { useState, useEffect } from 'react';
import { getDb, logAction, User } from '../db/db';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Trash2, Search, X } from 'lucide-react';

const UsersManagement: React.FC = () => {
    const { user: authUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // New User Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Consultor',
        title: ''
    });

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const db = getDb();
            const res = await db.exec({
                sql: "SELECT * FROM users ORDER BY id DESC",
                returnValue: 'resultRows',
                rowMode: 'object'
            });
            setUsers(res as unknown as User[]);
        } catch (e) {
            console.error("Error fetching users", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const db = getDb();
            await db.exec({
                sql: "INSERT INTO users (name, email, password, role, title) VALUES (?, ?, ?, ?, ?)",
                bind: [formData.name, formData.email, formData.password, formData.role, formData.title]
            });

            await logAction(
                authUser?.name || 'Sistema',
                'Creó Usuario',
                'Usuarios',
                `Creó al usuario ${formData.name} (${formData.email})`
            );

            alert("Usuario creado correctamente");
            setIsModalOpen(false);
            setFormData({ name: '', email: '', password: '', role: 'Consultor', title: '' });
            fetchUsers();
        } catch (e) {
            console.error("Error creating user", e);
            alert("Error al crear usuario. El email o nombre podrían estar duplicados.");
        }
    };

    const handleDeleteUser = async (id: number, name: string) => {
        if (id === authUser?.id) {
            alert("No puedes eliminarte a ti mismo.");
            return;
        }

        if (confirm(`¿Estás seguro de que deseas eliminar a ${name}? Esta acción no se puede deshacer.`)) {
            try {
                const db = getDb();
                await db.exec({
                    sql: "DELETE FROM users WHERE id = ?",
                    bind: [id]
                });

                await logAction(
                    authUser?.name || 'Sistema',
                    'Eliminó Usuario',
                    'Usuarios',
                    `Eliminó al usuario ${name} (ID: ${id})`
                );

                fetchUsers();
            } catch (e) {
                console.error("Error deleting user", e);
                alert("Error al eliminar usuario.");
            }
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in">
            <div className="flex-wrap align-center mb-2" style={{ gap: '8px', marginBottom: '20px' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '150px' }}>
                    <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} size={16} />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="text-truncate"
                        style={{
                            width: '100%',
                            padding: '10px 10px 10px 34px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            color: '#fff',
                            outline: 'none',
                            boxSizing: 'border-box',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn"
                    style={{ flexShrink: 0, padding: '10px 16px' }}
                >
                    <UserPlus size={16} />
                    <span>Nuevo</span>
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {isLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>Cargando usuarios...</div>
                ) : filteredUsers.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>No se encontraron usuarios.</div>
                ) : filteredUsers.map(u => (
                    <div
                        key={u.id}
                        className="glass-card"
                        style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)' }}
                    >
                        <div style={{
                            width: 50,
                            height: 50,
                            borderRadius: '50%',
                            background: u.avatarBase64 ? `url(${u.avatarBase64}) center/cover` : 'linear-gradient(135deg, var(--accent), #fff)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: '#000',
                            flexShrink: 0,
                            border: '2px solid rgba(255,255,255,0.1)'
                        }}>
                            {!u.avatarBase64 && u.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="flex align-center gap-2 mb-1">
                                <h3 className="text-truncate" style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>{u.name}</h3>
                                <span className="badge" style={{ fontSize: '0.65rem' }}>{u.role}</span>
                            </div>
                            <p className="text-truncate" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>{u.email}</p>
                            <p className="text-truncate" style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '4px' }}>{u.title || 'Consultor Intezia'}</p>
                        </div>
                        <div style={{ flexShrink: 0 }}>
                            <button
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                style={{
                                    background: 'rgba(231, 76, 60, 0.1)',
                                    border: '1px solid rgba(231, 76, 60, 0.2)',
                                    borderRadius: '10px',
                                    padding: '10px',
                                    color: '#ff6b6b',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                title="Eliminar"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '20px'
                }}>
                    <div className="glass-card fade-in" style={{ width: '100%', maxWidth: '500px', padding: '30px', position: 'relative', background: '#121212' }}>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.5 }}
                        >
                            <X size={24} />
                        </button>

                        <h2 style={{ marginTop: 0, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: '#fff' }}>
                            <UserPlus style={{ color: 'var(--accent)' }} size={24} />
                            Nuevo Consultor
                        </h2>

                        <form onSubmit={handleCreateUser}>
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', opacity: 0.8, fontSize: '0.9rem' }}>Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej. Juan Perez"
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', opacity: 0.8, fontSize: '0.9rem' }}>Correo Electrónico</label>
                                <input
                                    type="email"
                                    required
                                    className="form-input"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="juan@intezia.com"
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', opacity: 0.8, fontSize: '0.9rem' }}>Contraseña Inicial</label>
                                <input
                                    type="password"
                                    required
                                    className="form-input"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="123456"
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', opacity: 0.8, fontSize: '0.9rem' }}>Rol de Sistema</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="form-input"
                                        style={{ appearance: 'auto' }}
                                    >
                                        <option value="Consultor">Consultor</option>
                                        <option value="Admin">Admin</option>
                                        <option value="Super admin">Super Admin</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '8px', opacity: 0.8, fontSize: '0.9rem' }}>Cargo / Título</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Ej. Consultor SEO"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn" style={{ width: '100%' }}>
                                Crear Usuario Permanentemente
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersManagement;
