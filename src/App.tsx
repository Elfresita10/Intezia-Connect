import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Education from './pages/Education';
import EducationDetails from './pages/EducationDetails';
import Fundamentals from './pages/Fundamentals';
import AuditLog from './pages/AuditLog';
import Users from './pages/Users';

// A wrapper to protect routes
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Layout>{children}</Layout>;
};

import { AlertProvider } from './context/AlertContext';
import GlobalAlert from './components/GlobalAlert';

function App() {
  return (
    <AlertProvider>
      <AuthProvider>
        <BrowserRouter>
          <GlobalAlert />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Navigate to="/dashboard" replace /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
            <Route path="/projects/:id" element={<PrivateRoute><ProjectDetails /></PrivateRoute>} />
            <Route path="/education" element={<PrivateRoute><Education /></PrivateRoute>} />
            <Route path="/education/:id" element={<PrivateRoute><EducationDetails /></PrivateRoute>} />
            <Route path="/fundamentals" element={<PrivateRoute><Fundamentals /></PrivateRoute>} />
            <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
            <Route path="/audit-log" element={<PrivateRoute><AuditLog /></PrivateRoute>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AlertProvider>
  );
}

export default App;
