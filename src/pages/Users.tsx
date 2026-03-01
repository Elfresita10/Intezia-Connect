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
            <div className="flex flex-wrap space-between align-center mb-2" style={{ gap: '15px', marginBottom: '24px' }}>
                <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o correo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 10px 10px 40px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: '#fff',
                            outline: 'none'
                        }}
                    />
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn"
                >
                    <UserPlus size={18} />
                    Nuevo Consultor
                </button>
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <tr>
                                <th style={{ padding: '16px' }}>Nombre</th>
                                <th style={{ padding: '16px' }}>Email / Rol</th>
                                <th style={{ padding: '16px' }}>Cargo</th>
                                <th style={{ padding: '16px', textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>Cargando usuarios...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>No se encontraron usuarios.</td>
                                </tr>
                            ) : filteredUsers.map(u => (
                                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: '50%',
                                                background: u.avatarBase64 ? `url(${u.avatarBase64}) center/cover` : 'linear-gradient(135deg, var(--accent), #fff)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '14px',
                                                fontWeight: 'bold',
                                                color: '#fff'
                                            }}>
                                                {!u.avatarBase64 && u.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: 500 }}>{u.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>{u.email}</span>
                                            <span className="badge">
                                                {u.role}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px', opacity: 0.8 }}>{u.title || '-'}</td>
                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleDeleteUser(u.id, u.name)}
                                            style={{
                                                background: 'rgba(231, 76, 60, 0.1)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '8px',
                                                color: '#e74c3c',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s'
                                            }}
                                            title="Eliminar usuario"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
