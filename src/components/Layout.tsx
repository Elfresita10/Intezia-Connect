import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, User as UserIcon, Briefcase, GraduationCap, LogOut, History, Book, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { canViewAuditLog, canCreate } from '../utils/permissions';
import { getDb } from '../db/db';
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

    // Only Supervisors care about "En Revisión" tasks
    const isSupervisor = canCreate(user?.role);

    useEffect(() => {
        if (!isSupervisor || !user) return;

        const fetchPendingTasks = async () => {
            try {
                const db = getDb();
                const res = await db.exec({
                    sql: "SELECT count(*) as count FROM project_tasks WHERE status = 'En Revisión'",
                    returnValue: 'resultRows',
                    rowMode: 'object'
                });

                if (res.length > 0) {
                    setPendingReviewCount((res[0] as any).count || 0);
                }
            } catch (e) {
                console.error("Error fetching pending task count", e);
            }
        };

        fetchPendingTasks();

        // Simple polling every 5 seconds to keep the badge updated across navigation
        const interval = setInterval(fetchPendingTasks, 5000);
        return () => clearInterval(interval);
    }, [isSupervisor, user]);

    useEffect(() => {
        // Check for Friday reminder on app load
        NotificationService.checkFridayReminder();

        // Also check every hour if the app stays open
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
                    <img src={logo} alt="Logo" className="mobile-logo" />
                    <div className="title-divider" />
                    <div className="header-titles">
                        <h1>{getPageTitle(location.pathname)}</h1>
                        {user && <span className="user-role">{user.role}</span>}
                    </div>
                </div>
                <div className="header-right">
                    <div className="user-avatar" style={{ background: user?.avatarBase64 ? `url(${user.avatarBase64}) center/cover` : 'linear-gradient(135deg, var(--accent), #fff)' }}>
                        {!user?.avatarBase64 && (user ? user.name.substring(0, 2).toUpperCase() : 'CJ')}
                    </div>
                    <button
                        onClick={handleRequestNotifs}
                        className="logout-btn"
                        style={{ background: notifPermission === 'granted' ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)', color: notifPermission === 'granted' ? 'var(--accent)' : '#fff' }}
                        title={notifPermission === 'granted' ? "Notificaciones activas" : "Activar notificaciones"}
                    >
                        {notifPermission === 'granted' ? <Bell size={16} /> : <BellOff size={16} />}
                    </button>
                    <button onClick={handleLogout} className="logout-btn" title="Cerrar sesión">
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            <main className="page-content">
                {children}
            </main>

            <nav className="bottom-nav">
                <div className="sidebar-logo desktop-only">
                    <img src={logo} alt="Logo" />
                </div>

                <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Home size={24} />
                    <span>Inicio</span>
                </NavLink>
                <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <UserIcon size={24} />
                    <span>Perfil</span>
                </NavLink>
                <NavLink to="/projects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ position: 'relative' }}>
                    <Briefcase size={24} />
                    <span>Proyectos</span>
                    {(pendingReviewCount > 0 && isSupervisor) && (
                        <span className="badge-notification">{pendingReviewCount}</span>
                    )}
                </NavLink>
                <NavLink to="/education" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <GraduationCap size={24} />
                    <span>Educación</span>
                </NavLink>
                <NavLink to="/fundamentals" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Book size={24} />
                    <span>Fundamentos</span>
                </NavLink>
                {user?.role === 'Super admin' && (
                    <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Users size={24} />
                        <span>Usuarios</span>
                    </NavLink>
                )}
                {canViewAuditLog(user?.role) && (
                    <NavLink to="/audit-log" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <History size={24} />
                        <span>Bitácora</span>
                    </NavLink>
                )}

                <div className="sidebar-user desktop-only">
                    <div className="header-left">
                        <div className="user-avatar" style={{ background: user?.avatarBase64 ? `url(${user.avatarBase64}) center/cover` : 'linear-gradient(135deg, var(--accent), #fff)' }}>
                            {!user?.avatarBase64 && (user ? user.name.substring(0, 2).toUpperCase() : 'CJ')}
                        </div>
                        <div className="header-titles">
                            <span className="user-name-sidebar">{user?.name}</span>
                            <span className="user-role">{user?.role}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={handleRequestNotifs}
                            className="logout-btn"
                            style={{ background: notifPermission === 'granted' ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)', color: notifPermission === 'granted' ? 'var(--accent)' : '#fff' }}
                            title={notifPermission === 'granted' ? "Notificaciones activas" : "Activar notificaciones"}
                        >
                            {notifPermission === 'granted' ? <Bell size={16} /> : <BellOff size={16} />}
                        </button>
                        <button onClick={handleLogout} className="logout-btn" title="Cerrar sesión">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </nav>
            <KeiaChat />
        </div>
    );
};

export default Layout;
