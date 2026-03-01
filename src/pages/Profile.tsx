import React, { useEffect, useState, useRef } from 'react';
import { Mail, Phone, Edit3, Camera, Save, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDb, User, logAction } from '../db/db';
import { canEdit } from '../utils/permissions';

const Profile: React.FC = () => {
    const { user: authUser, refreshUser } = useAuth();
    const [profile, setProfile] = useState<User | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<User>>({});
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchProfile = async (userId: number) => {
        try {
            const db = getDb();
            const result = await db.exec({
                sql: 'SELECT * FROM users WHERE id = ?',
                bind: [userId],
                returnValue: 'resultRows',
                rowMode: 'object'
            });
            if (result.length > 0) {
                const fetchedUser = result[0] as unknown as User;
                setProfile(fetchedUser);
                setEditForm(fetchedUser);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const db = getDb();
            const result = await db.exec({
                sql: 'SELECT id, name, title FROM users',
                returnValue: 'resultRows',
                rowMode: 'object'
            });
            setAllUsers(result as unknown as User[]);
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
            const db = getDb();
            const targetId = displayProfile.id;
            console.log("Desperately trying to save profile for ID:", targetId);

            // Use INSERT OR REPLACE to handle cases where seeding might have failed
            // but the user is logged in via memory fallback.
            await db.exec({
                sql: `INSERT OR REPLACE INTO users (
                    id, 
                    name, 
                    title, 
                    email, 
                    phone, 
                    bio, 
                    avatarBase64,
                    role,
                    password
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, (SELECT password FROM users WHERE id = ?) || '123456')`,
                bind: [
                    targetId,
                    editForm.name || displayProfile.name,
                    editForm.title || displayProfile.title,
                    editForm.email || displayProfile.email,
                    editForm.phone || displayProfile.phone,
                    editForm.bio || displayProfile.bio,
                    editForm.avatarBase64 !== undefined ? editForm.avatarBase64 : displayProfile.avatarBase64,
                    displayProfile.role,
                    targetId
                ]
            });

            await logAction(
                authUser.name,
                'Actualizó Perfil (UPSERT)',
                'Usuarios',
                `Actualizó el perfil de ${displayProfile.name} (ID: ${targetId})`
            );

            // Refetch data from DB immediately
            await fetchProfile(targetId);

            // If editing own profile, refresh global auth state
            if (authUser.id === targetId) {
                await refreshUser();
            }

            setIsEditing(false);
            console.log("Save successful for ID:", targetId);
            alert("Perfil actualizado correctamente");
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Error crítico al guardar el perfil. Revisa la consola.");
        }
    };

    // Use the authUser as a base for fallbacks so the page is never blank
    const displayProfile = profile || (authUser ? {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email || (authUser.name?.includes('@') ? authUser.name : ''),
        role: authUser.role,
        title: authUser.title || 'Consultor',
        bio: authUser.bio || 'Bienvenido a tu perfil profesional.',
        phone: authUser.phone || 'No especificado',
        avatarBase64: authUser.avatarBase64
    } : null) as User;

    if (!displayProfile) return <div className="skeleton" style={{ height: '300px' }}></div>;

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

                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    <div
                        onClick={handleAvatarClick}
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
                            cursor: isEditing ? 'pointer' : 'default',
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
                            className="text-truncate"
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
                        <h2 className="text-truncate" style={{ fontSize: '1.8rem', marginBottom: '0.2rem', color: '#fff', padding: '0 20px' }}>{displayProfile.name}</h2>
                    )}

                    {isEditing ? (
                        <input
                            type="text"
                            value={editForm.title || ''}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="text-truncate"
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
                        <p className="badge text-truncate" style={{ marginBottom: '1.5rem', maxWidth: '80%', marginInline: 'auto' }}>{displayProfile.title}</p>
                    )}

                    {isEditing ? (
                        <textarea
                            value={editForm.bio || ''}
                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                            rows={4}
                            style={{
                                width: '100%',
                                background: 'var(--bg-color)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                color: 'var(--text-secondary)',
                                padding: '0.75rem',
                                lineHeight: 1.6,
                                marginBottom: '2rem'
                            }}
                        />
                    ) : (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '2rem', lineHeight: 1.6 }}>
                            {displayProfile.bio}
                        </p>
                    )}
                </div>

                <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
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
                                <div style={{ fontSize: '0.95rem', color: '#e6edf3' }}>{displayProfile.email}</div>
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
