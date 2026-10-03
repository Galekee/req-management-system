import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, PlusCircle, Users, Bell, Shield, LogOut, User, Palette, MessageSquare, Menu, X } from 'lucide-react';
import { AuthProvider, useAuth } from './AuthContext';
import { ToastProvider } from './components/Toast';
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
import Messages from './pages/Messages';

import './App.css';

// ─── Themes ───────────────────────────────────────────────
const THEMES = [
  { key: 'dark',   label: '🌑 Dark',         color: '#6366f1', bg: '#060608' },
  { key: 'light',  label: '☀️ Light',         color: '#6366f1', bg: '#f5f6fa' },
  { key: 'purple', label: '🟣 Purple Haze',   color: '#a855f7', bg: '#0d0a1a' },
  { key: 'matrix', label: '🟢 Matrix Green',  color: '#00ff41', bg: '#001400' },
  { key: 'navy',   label: '🔵 Navy Blue',     color: '#3b82f6', bg: '#0a1628' },
];

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('fl_theme') || 'dark');
  const [navMode, setNavMode] = useState(() => localStorage.getItem('fl_nav') || 'vertical');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fl_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('fl_nav', navMode);
  }, [navMode]);

  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppContent theme={theme} setTheme={setTheme} navMode={navMode} setNavMode={setNavMode} />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

function AppContent({ theme, setTheme, navMode, setNavMode }) {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="layout">
      {navMode === 'vertical'
        ? <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
        : <TopNav mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
      }
      {/* Mobile overlay */}
      {navMode === 'vertical' && mobileMenuOpen && (
        <div className="sidebar-overlay visible" onClick={() => setMobileMenuOpen(false)} />
      )}
      <main className={`main ${navMode === 'topnav' ? 'topnav-mode' : ''}`}
        id="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/new" element={<ProtectedRoute roles={['client','admin']}><NewProject /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/freelancers" element={<Freelancers />} />
          <Route path="/freelancers/:id" element={<FreelancerDetail />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>} />
          <Route path="/client" element={<ProtectedRoute roles={['client','admin']}><ClientDashboard /></ProtectedRoute>} />
          <Route path="/freelancer" element={<ProtectedRoute roles={['freelancer']}><FreelancerDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {/* Floating control panel */}
      <CtrlPanel theme={theme} setTheme={setTheme} navMode={navMode} setNavMode={setNavMode} />
    </div>
  );
}

// ─── Floating control panel ────────────────────────────────
function CtrlPanel({ theme, setTheme, navMode, setNavMode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="ctrl-panel" ref={ref}>
      {open && (
        <div className="ctrl-popup">
          <div className="ctrl-section-label">Тема / Theme</div>
          <div className="theme-swatches">
            {THEMES.map(t => (
              <button
                key={t.key}
                className={`theme-swatch ${theme === t.key ? 'active' : ''}`}
                style={{ background: t.bg, border: `2px solid ${t.color}` }}
                data-label={t.label}
                onClick={() => setTheme(t.key)}
                title={t.label}
              />
            ))}
          </div>

          <div className="ctrl-section-label">Навигация</div>
          <div className="nav-mode-toggle">
            <button
              className={`nav-mode-btn ${navMode === 'vertical' ? 'active' : ''}`}
              onClick={() => setNavMode('vertical')}
            >
              ⬛ Sidebar
            </button>
            <button
              className={`nav-mode-btn ${navMode === 'topnav' ? 'active' : ''}`}
              onClick={() => setNavMode('topnav')}
            >
              ▬ Top
            </button>
          </div>
        </div>
      )}
      <button className="ctrl-toggle" onClick={() => setOpen(o => !o)} title="Параметрлер">
        <Palette size={16} />
      </button>
    </div>
  );
}

// ─── Vertical Sidebar ──────────────────────────────────────
function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const fetch = () => axios.get(`/api/stats?user_id=${user?.id}`).then(r => {
      setUnread(r.data.unreadCount || 0);
      setUnreadMsgs(r.data.unreadMessages || 0);
    }).catch(() => {});
    fetch();
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const commonNav = [
    { to: '/', icon: <LayoutDashboard size={18} />, label: 'Дашборд' },
    { to: '/projects', icon: <Briefcase size={18} />, label: 'Жобалар' },
    { to: '/freelancers', icon: <Users size={18} />, label: 'Фрилансерлер' },
    { to: '/notifications', icon: <Bell size={18} />, label: 'Хабарландырулар', badge: unread > 0 ? unread : null },
    { to: '/messages', icon: <MessageSquare size={18} />, label: 'Хабарламалар', badge: unreadMsgs > 0 ? unreadMsgs : null },
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

  const extraNav = user.role === 'admin' ? adminNav : user.role === 'client' ? clientNav : user.role === 'freelancer' ? freelancerNav : [];
  const ROLE_LABELS = { admin: 'Администратор', client: 'Клиент', freelancer: 'Фрилансер' };
  const ROLE_COLORS = { admin: '#ef4444', client: '#6366f1', freelancer: '#10b981' };

  // Sync main margin
  useEffect(() => {
    const main = document.getElementById('main-content');
    if (!main) return;
    main.style.marginLeft = collapsed ? '60px' : '240px';
    main.style.maxWidth = collapsed ? 'calc(100vw - 60px)' : 'calc(100vw - 240px)';
  }, [collapsed]);

  return (
    <aside
      className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
    >
      <div className="sidebar-brand">
        <div className="brand-logo" style={{ background: 'none', padding: 0, boxShadow: 'none' }}>
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="9" fill="url(#logo-grad-sb)"/>
            <defs>
              <linearGradient id="logo-grad-sb" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="var(--accent)"/>
                <stop offset="100%" stopColor="var(--purple, var(--accent))"/>
              </linearGradient>
            </defs>
            <path d="M9 8h14v3.5H12.5v3h9v3h-9v6.5H9V8z" fill="white"/>
          </svg>
        </div>
        {!collapsed && (
          <div>
            <div className="brand-name">Freelanzer</div>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {!collapsed && <div className="nav-section-label">Навигация</div>}
        {commonNav.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            title={collapsed ? item.label : undefined}>
            {item.icon}
            {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
            {!collapsed && item.badge && (
              <span className="nav-badge">{item.badge}</span>
            )}
            {collapsed && item.badge && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                background: 'var(--accent)', color: '#fff', borderRadius: 999,
                fontSize: 9, fontWeight: 700, padding: '1px 4px', minWidth: 14, textAlign: 'center'
              }}>{item.badge}</span>
            )}
          </NavLink>
        ))}

        {extraNav.length > 0 && (
          <>
            {!collapsed && <div className="nav-section-label" style={{ marginTop: 12 }}>Менің бөлімім</div>}
            {collapsed && <div style={{ height: 12 }} />}
            {extraNav.map(item => (
              <NavLink key={item.to} to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}>
                {item.icon}
                {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-bottom">
        <div className="team-info">
          <div className="team-avatar" style={{ background: ROLE_COLORS[user.role] }}>
            {user.name[0]}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="team-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div className="team-role" style={{ fontSize: 11, color: ROLE_COLORS[user.role], fontWeight: 600 }}>
                {ROLE_LABELS[user.role]}
              </div>
            </div>
          )}
        </div>
        <button onClick={handleLogout} className="logout-btn" title={collapsed ? 'Шығу' : undefined}>
          <LogOut size={13} />
          {!collapsed && <span className="logout-label">Шығу</span>}
        </button>
      </div>
    </aside>
  );
}

// ─── Horizontal Top Nav ────────────────────────────────────
function TopNav({ mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const fetch = () => axios.get(`/api/stats?user_id=${user?.id}`).then(r => setUnread(r.data.unreadCount || 0)).catch(() => {});
    fetch();
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const commonNav = [
    { to: '/', icon: <LayoutDashboard size={15} />, label: 'Дашборд' },
    { to: '/projects', icon: <Briefcase size={15} />, label: 'Жобалар' },
    { to: '/freelancers', icon: <Users size={15} />, label: 'Фрилансерлер' },
    { to: '/notifications', icon: <Bell size={15} />, label: `Хабарландырулар${unread > 0 ? ` (${unread})` : ''}` },
    { to: '/messages', icon: <MessageSquare size={15} />, label: 'Хабарламалар' },
  ];
  const adminNav = [
    { to: '/admin', icon: <Shield size={15} />, label: 'Админ' },
    { to: '/client', icon: <User size={15} />, label: 'Клиент' },
    { to: '/projects/new', icon: <PlusCircle size={15} />, label: 'Жаңа жоба' },
  ];
  const clientNav = [
    { to: '/client', icon: <User size={15} />, label: 'Менің жобаларым' },
    { to: '/projects/new', icon: <PlusCircle size={15} />, label: 'Жаңа жоба' },
  ];
  const freelancerNav = [{ to: '/freelancer', icon: <User size={15} />, label: 'Кабинет' }];

  const extraNav = user.role === 'admin' ? adminNav : user.role === 'client' ? clientNav : user.role === 'freelancer' ? freelancerNav : [];
  const ROLE_COLORS = { admin: '#ef4444', client: '#6366f1', freelancer: '#10b981' };

  return (
    <nav className="topnav">
      <button className="hamburger-btn" onClick={() => setMobileOpen(o => !o)}>
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <div className="topnav-brand">
        <div className="brand-logo" style={{ width: 30, height: 30, background: 'none', padding: 0, boxShadow: 'none' }}>
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="9" fill="url(#logo-grad-tn)"/>
            <defs>
              <linearGradient id="logo-grad-tn" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="var(--accent)"/>
                <stop offset="100%" stopColor="var(--purple, var(--accent))"/>
              </linearGradient>
            </defs>
            <path d="M9 8h14v3.5H12.5v3h9v3h-9v6.5H9V8z" fill="white"/>
          </svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Freelanzer</span>
      </div>

      <div className={`topnav-links ${mobileOpen ? 'mobile-open' : ''}`}>
        {[...commonNav, ...extraNav].map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="topnav-right">
        <div className="topnav-user">
          <div style={{
            width: 26, height: 26, borderRadius: 6, background: ROLE_COLORS[user.role],
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff'
          }}>{user.name[0]}</div>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>{user.name}</span>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ padding: '5px 10px', opacity: 0.7 }}>
          <LogOut size={13} /> Шығу
        </button>
      </div>
    </nav>
  );
}
