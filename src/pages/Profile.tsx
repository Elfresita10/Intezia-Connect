import React, { useEffect, useState, useRef } from 'react';
import { Mail, Phone, Edit3, Camera, Save, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getOrInitDB, User, logAction } from '../db/db';
import { canEdit } from '../utils/permissions';
import { useAlert } from '../context/AlertContext';

const Profile: React.FC = () => {
    const { user: authUser, refreshUser } = useAuth();
    const { showAlert } = useAlert();
    const [profile, setProfile] = useState<User | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<User>>({});
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchProfile = async (userId: number) => {
        try {
            const db = await getOrInitDB();
            const result = await db.exec({
                sql: 'SELECT * FROM users WHERE id = ?',
                bind: [userId],
                returnValue: 'resultRows'
            });
            if (result && result.length > 0) {
                const fetchedUser = result[0] as unknown as User;
                setProfile(fetchedUser);
                setEditForm(fetchedUser);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            showAlert('No se pudo cargar el perfil.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const db = await getOrInitDB();
            const result = await db.exec({
                sql: 'SELECT id, name, title FROM users',
                returnValue: 'resultRows'
            });
            setAllUsers(result || []);
        } catch (error) {
            console.error("Error fetching all users:", error);
        }
    };

    useEffect(() => {
        if (authUser) {
            fetchProfile(authUser.id);
            setSelectedUserId(authUser.id);
            if (canEdit(authUser.role)) {
                fetchAllUsers();
            }
        }
    }, [authUser]);

    const handleUserSelect = (id: number) => {
        setLoading(true);
        setSelectedUserId(id);
        fetchProfile(id);
        setIsEditing(false);
    };

    const handleAvatarClick = () => {
        if (isEditing) {
            fileInputRef.current?.click();
        }
    };

    const compressImage = (base64Str: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const max_size = 400;

                if (width > height) {
                    if (width > max_size) {
                        height *= max_size / width;
                        width = max_size;
                    }
                } else {
                    if (height > max_size) {
                        width *= max_size / height;
                        height = max_size;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result as string;
                const compressed = await compressImage(base64String);
                setEditForm(prev => ({ ...prev, avatarBase64: compressed }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!displayProfile || !authUser) return;

        try {
            const db = await getOrInitDB();
            const targetId = displayProfile.id;

            await db.exec({
                sql: `UPDATE users SET 
                    name = ?, 
                    title = ?, 
                    email = ?, 
                    phone = ?, 
                    bio = ?, 
                    avatarBase64 = ?
                    WHERE id = ?`,
                bind: [
                    editForm.name || displayProfile.name,
                    editForm.title || displayProfile.title,
                    editForm.email || displayProfile.email,
                    editForm.phone || displayProfile.phone,
                    editForm.bio || displayProfile.bio,
                    editForm.avatarBase64 !== undefined ? editForm.avatarBase64 : displayProfile.avatarBase64,
                    targetId
                ]
            });

            await logAction(
                authUser.name,
                'Actualizó Perfil',
                'Usuarios',
                `Perfil actualizado: ${displayProfile.name}`
            );

            await fetchProfile(targetId);

            if (authUser.id === targetId) {
                await refreshUser();
            }

            setIsEditing(false);
            showAlert("Perfil actualizado correctamente", 'success');
        } catch (error) {
            console.error("Error saving profile:", error);
            showAlert("Error al guardar el perfil.", 'error');
        }
    };

    const displayProfile = profile || (authUser ? {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email || '',
        role: authUser.role,
        title: authUser.title || 'Consultor',
        bio: authUser.bio || '',
        phone: authUser.phone || '',
        avatarBase64: authUser.avatarBase64
    } : null) as User;

    if (loading || !displayProfile) return <div className="skeleton" style={{ height: '400px', borderRadius: '20px' }}></div>;

    const targetIdForEdit = displayProfile.id;
    const canEditThisProfile = authUser?.id === targetIdForEdit || canEdit(authUser?.role);

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
            {canEdit(authUser?.role) && (
                <div className="card mb-2" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Gestionar Perfil:</span>
                        <select
                            value={selectedUserId || ''}
                            onChange={(e) => handleUserSelect(Number(e.target.value))}
                            style={{
                                padding: '0.5rem',
                                background: 'var(--bg-surface-glass)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                color: '#fff',
                                flex: 1,
                                minWidth: '200px'
                            }}
                        >
                            {allUsers.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.title})</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: '1.5rem', position: 'relative', minHeight: '450px' }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', padding: '0 1rem', marginBottom: '1rem' }}>
                    {canEditThisProfile && !isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="btn"
                            style={{ padding: '0.4rem 0.8rem', minHeight: '36px' }}
                        >
                            <Edit3 size={16} /> Editar
                        </button>
                    )}
                    {isEditing && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => { setIsEditing(false); setEditForm(displayProfile); }}
                                className="btn"
                                style={{ padding: '0.4rem 0.8rem', background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c', minHeight: '36px' }}
                            >
                                <X size={16} />
                            </button>
                            <button
                                onClick={handleSave}
                                className="btn btn-primary"
                                style={{ padding: '0.4rem 0.8rem', minHeight: '36px' }}
                            >
                                <Save size={16} /> Guardar
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ position: 'relative', marginBottom: '1.5rem', cursor: isEditing ? 'pointer' : 'default' }} onClick={handleAvatarClick}>
                    <div
                        style={{
                            width: 140,
                            height: 140,
                            borderRadius: '50%',
                            background: (isEditing ? editForm.avatarBase64 : displayProfile.avatarBase64) ? `url(${isEditing ? editForm.avatarBase64 : displayProfile.avatarBase64}) center/cover` : 'linear-gradient(135deg, var(--accent), #79b8ff)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '48px',
                            fontWeight: 'bold',
                            color: '#fff',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                            overflow: 'hidden',
                            border: '4px solid var(--bg-surface-glass)'
                        }}
                    >
                        {!(isEditing ? editForm.avatarBase64 : displayProfile.avatarBase64) && displayProfile.name.substring(0, 2).toUpperCase()}
                        {isEditing && (
                            <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '30%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Camera size={20} />
                            </div>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>

                <div style={{ width: '100%', maxWidth: '500px' }}>
                    {isEditing ? (
                        <input
                            type="text"
                            value={editForm.name || ''}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            style={{
                                fontSize: '1.8rem',
                                fontWeight: 'bold',
                                width: '100%',
                                textAlign: 'center',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '1px solid var(--border-color)',
                                color: '#fff',
                                marginBottom: '0.5rem',
                                outline: 'none'
                            }}
                        />
                    ) : (
                        <h2 className="text-truncate" style={{ fontSize: '1.8rem', marginBottom: '0.2rem', color: '#fff' }}>{displayProfile.name}</h2>
                    )}

                    {isEditing ? (
                        <input
                            type="text"
                            value={editForm.title || ''}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            style={{
                                fontSize: '0.85rem',
                                width: '100%',
                                textAlign: 'center',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '1px solid var(--border-color)',
                                color: 'var(--accent)',
                                marginBottom: '1.5rem',
                                outline: 'none'
                            }}
                        />
                    ) : (
                        <p className="badge" style={{ marginBottom: '1.5rem' }}>{displayProfile.title}</p>
                    )}

                    {isEditing ? (
                        <textarea
                            value={editForm.bio || ''}
                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                            rows={4}
                            className="form-input"
                            style={{ width: '100%', marginBottom: '2rem' }}
                        />
                    ) : (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '2rem', lineHeight: 1.6, padding: '0 20px' }}>
                            {displayProfile.bio}
                        </p>
                    )}
                </div>

                <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <Mail size={20} color="var(--accent)" />
                        <div style={{ textAlign: 'left', flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Correo Electrónico</div>
                            {isEditing ? (
                                <input
                                    type="email"
                                    value={editForm.email || ''}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    style={{ width: '100%', background: 'transparent', border: 'none', color: '#e6edf3', fontSize: '0.95rem' }}
                                />
                            ) : (
                                <div style={{ fontSize: '0.95rem', color: '#e6edf3', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayProfile.email}</div>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <Phone size={20} color="var(--accent)" />
                        <div style={{ textAlign: 'left', flex: 1 }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Teléfono</div>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editForm.phone || ''}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    style={{ width: '100%', background: 'transparent', border: 'none', color: '#e6edf3', fontSize: '0.95rem' }}
                                />
                            ) : (
                                <div style={{ fontSize: '0.95rem', color: '#e6edf3' }}>{displayProfile.phone}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
