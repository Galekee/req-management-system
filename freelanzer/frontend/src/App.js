import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, PlusCircle, Users, Bell, Shield, LogOut, User } from 'lucide-react';
import { AuthProvider, useAuth } from './AuthContext';
import axios from 'axios';

import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import NewProject from './pages/NewProject';
import Freelancers from './pages/Freelancers';
import FreelancerDetail from './pages/FreelancerDetail';
import Notifications from './pages/Notifications';
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import ClientDashboard from './pages/ClientDashboard';
import FreelancerDashboard from './pages/FreelancerDashboard';

import './App.css';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="layout">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/new" element={<ProtectedRoute roles={['client','admin']}><NewProject /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/freelancers" element={<Freelancers />} />
          <Route path="/freelancers/:id" element={<FreelancerDetail />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>} />
          <Route path="/client" element={<ProtectedRoute roles={['client','admin']}><ClientDashboard /></ProtectedRoute>} />
          <Route path="/freelancer" element={<ProtectedRoute roles={['freelancer']}><FreelancerDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const fetch = () => axios.get('/api/stats').then(r => setUnread(r.data.unreadCount || 0)).catch(() => {});
    fetch();
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Role-based nav
  const commonNav = [
    { to: '/', icon: <LayoutDashboard size={18} />, label: 'Дашборд' },
    { to: '/projects', icon: <Briefcase size={18} />, label: 'Жобалар' },
    { to: '/freelancers', icon: <Users size={18} />, label: 'Фрилансерлер' },
    { to: '/notifications', icon: <Bell size={18} />, label: 'Хабарландырулар', badge: unread > 0 ? unread : null },
  ];

  const adminNav = [
    { to: '/admin', icon: <Shield size={18} />, label: 'Админ панелі' },
    { to: '/client', icon: <User size={18} />, label: 'Клиент бөлімі' },
    { to: '/projects/new', icon: <PlusCircle size={18} />, label: 'Жоба жариялау' },
  ];

  const clientNav = [
    { to: '/client', icon: <User size={18} />, label: 'Менің жобаларым' },
    { to: '/projects/new', icon: <PlusCircle size={18} />, label: 'Жоба жариялау' },
  ];

  const freelancerNav = [
    { to: '/freelancer', icon: <User size={18} />, label: 'Менің кабинетім' },
  ];

  const extraNav =
    user.role === 'admin' ? adminNav :
    user.role === 'client' ? clientNav :
    user.role === 'freelancer' ? freelancerNav : [];

  const ROLE_LABELS = { admin: 'Администратор', client: 'Клиент', freelancer: 'Фрилансер' };
  const ROLE_COLORS = { admin: '#ef4444', client: '#6366f1', freelancer: '#10b981' };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo"><span>F</span></div>
        <div>
          <div className="brand-name">Freelanzer</div>
          <div className="brand-sub">АЖ-49 · 2026</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Навигация</div>
        {commonNav.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            {item.icon}
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && (
              <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 999, fontSize: 10, fontWeight: 700, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}

        {extraNav.length > 0 && (
          <>
            <div className="nav-section-label" style={{ marginTop: 16 }}>Менің бөлімім</div>
            {extraNav.map(item => (
              <NavLink key={item.to} to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                {item.icon}
                <span style={{ flex: 1 }}>{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-bottom">
        <div className="team-info" style={{ marginBottom: 8 }}>
          <div className="team-avatar" style={{ background: ROLE_COLORS[user.role] }}>
            {user.name[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="team-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div style={{ fontSize: 11, color: ROLE_COLORS[user.role], fontWeight: 600 }}>
              {ROLE_LABELS[user.role]}
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', opacity: 0.7 }}>
          <LogOut size={13} /> Шығу
        </button>
      </div>
    </aside>
  );
}
