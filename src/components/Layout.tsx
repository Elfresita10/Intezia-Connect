import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, User as UserIcon, Briefcase, GraduationCap, LogOut, History, Book, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { canViewAuditLog, canCreate } from '../utils/permissions';
import { getOrInitDB } from '../db/db';
import KeiaChat from './KeiaChat';
import { NotificationService } from '../utils/NotificationService';
import { Bell, BellOff } from 'lucide-react';
import logo from '../assets/images/logo-app.png';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [pendingReviewCount, setPendingReviewCount] = useState(0);
    const [notifPermission, setNotifPermission] = useState<NotificationPermission>(NotificationService.getPermissionStatus());

    const isSupervisor = canCreate(user?.role);

    useEffect(() => {
        if (!isSupervisor || !user) return;

        const fetchPendingTasks = async () => {
            try {
                const db = await getOrInitDB();
                const res = await db.exec({
                    sql: "SELECT count(*) as count FROM project_tasks WHERE status = 'En Revisión'",
                    returnValue: 'resultRows'
                });

                if (res && res.length > 0) {
                    setPendingReviewCount(res[0].count || 0);
                }
            } catch (e) {
                console.error("Layout DB Error:", e);
            }
        };

        fetchPendingTasks();
        const interval = setInterval(fetchPendingTasks, 10000);
        return () => clearInterval(interval);
    }, [isSupervisor, user]);

    useEffect(() => {
        NotificationService.checkFridayReminder();
        const interval = setInterval(() => {
            NotificationService.checkFridayReminder();
        }, 3600000);
        return () => clearInterval(interval);
    }, []);

    const handleRequestNotifs = async () => {
        const granted = await NotificationService.requestPermission();
        setNotifPermission(NotificationService.getPermissionStatus());
        if (granted) {
            NotificationService.sendLocalNotification('¡Notificaciones Activadas!', {
                body: 'Recibirás avisos de nuevos proyectos y recordatorios los viernes.'
            });
        }
    };

    const getPageTitle = (path: string) => {
        if (path.includes('dashboard')) return 'Resumen';
        if (path.includes('profile')) return 'Mi Perfil';
        if (path.includes('projects')) return 'Proyectos';
        if (path.includes('education')) return 'Educación';
        if (path.includes('fundamentals')) return 'Fundamentos';
        if (path.includes('users')) return 'Gestión de Usuarios';
        if (path.includes('audit-log')) return 'Bitácora';
        return 'Intezia Connect';
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="app-container">
            <header className="header mobile-header-only">
                <div className="header-left">
                    <img src={logo} alt="Logo" className="mobile-logo" style={{ height: '24px' }} />
                    <div className="title-divider" />
                    <div className="header-titles">
                        <h1>{getPageTitle(location.pathname)}</h1>
                        {user && <span className="user-role">{user.role}</span>}
                    </div>
                </div>
                <div className="header-right">
                    <div className="user-avatar" style={{ background: user?.avatarBase64 ? `url(${user.avatarBase64}) center/cover` : 'linear-gradient(135deg, var(--accent), #fff)' }}>
                        {!user?.avatarBase64 && (user ? user.name.substring(0, 2).toUpperCase() : 'U')}
                    </div>
                    <button onClick={handleLogout} className="logout-btn" title="Cerrar sesión">
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <nav className="mobile-bottom-nav">
                <NavLink to="/dashboard" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}><Home size={22} /><span>Inicio</span></NavLink>
                <NavLink to="/profile" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}><UserIcon size={22} /><span>Perfil</span></NavLink>
                <NavLink to="/projects" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`} style={{ position: 'relative' }}>
                    <Briefcase size={22} /><span>Proyectos</span>
                    {pendingReviewCount > 0 && isSupervisor && <span className="badge-notification">{pendingReviewCount}</span>}
                </NavLink>
                <NavLink to="/education" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}><GraduationCap size={22} /><span>Educa</span></NavLink>
                <NavLink to="/fundamentals" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}><Book size={22} /><span>Funda</span></NavLink>
            </nav>

            <aside className="desktop-sidebar">
                <div className="sidebar-logo">
                    <img src={logo} alt="Logo" />
                </div>
                <div className="sidebar-nav">
                    <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}><Home size={20} /><span>Inicio</span></NavLink>
                    <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}><UserIcon size={20} /><span>Mi Perfil</span></NavLink>
                    <NavLink to="/projects" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={{ position: 'relative' }}>
                        <Briefcase size={20} /><span>Proyectos</span>
                        {pendingReviewCount > 0 && isSupervisor && <span className="badge-notification">{pendingReviewCount}</span>}
                    </NavLink>
                    <NavLink to="/education" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}><GraduationCap size={20} /><span>Educación</span></NavLink>
                    <NavLink to="/fundamentals" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}><Book size={20} /><span>Fundamentos Intezia</span></NavLink>
                    {user?.role === 'Super admin' && (
                        <NavLink to="/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}><Users size={20} /><span>Usuarios</span></NavLink>
                    )}
                    {canViewAuditLog(user?.role) && (
                        <NavLink to="/audit-log" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}><History size={20} /><span>Bitácora</span></NavLink>
                    )}
                </div>

                <div className="sidebar-user">
                    <div className="user-profile-info">
                        <div className="user-avatar" style={{ background: user?.avatarBase64 ? `url(${user.avatarBase64}) center/cover` : 'linear-gradient(135deg, var(--accent), #fff)' }}>
                            {!user?.avatarBase64 && (user ? user.name.substring(0, 2).toUpperCase() : 'U')}
                        </div>
                        <div className="user-details">
                            <span className="user-name">{user?.name}</span>
                            <span className="user-role-label">{user?.role}</span>
                        </div>
                    </div>
                    <div className="sidebar-actions">
                        <button onClick={handleLogout} className="mini-action-btn" title="Cerrar sesión">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            <main className="page-content">
                <div className="content-inner">
                    {children}
                </div>
            </main>

            <KeiaChat />
        </div>
    );
};

export default Layout;
