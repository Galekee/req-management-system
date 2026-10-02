import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, PlusCircle, Users, Bell } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import NewProject from './pages/NewProject';
import Freelancers from './pages/Freelancers';
import FreelancerDetail from './pages/FreelancerDetail';
import Notifications from './pages/Notifications';
import axios from 'axios';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="layout">
        <Sidebar />
        <main className="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/new" element={<NewProject />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/freelancers" element={<Freelancers />} />
            <Route path="/freelancers/:id" element={<FreelancerDetail />} />
            <Route path="/notifications" element={<Notifications />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function Sidebar() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const fetch = () => axios.get('/api/stats').then(r => setUnread(r.data.unreadCount || 0)).catch(() => {});
    fetch();
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, []);

  const nav = [
    { to: '/', icon: <LayoutDashboard size={18} />, label: 'Дашборд' },
    { to: '/projects', icon: <Briefcase size={18} />, label: 'Жобалар' },
    { to: '/projects/new', icon: <PlusCircle size={18} />, label: 'Жоба жариялау' },
    { to: '/freelancers', icon: <Users size={18} />, label: 'Фрилансерлер' },
    {
      to: '/notifications', icon: <Bell size={18} />, label: 'Хабарландырулар',
      badge: unread > 0 ? unread : null
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <span>F</span>
        </div>
        <div>
          <div className="brand-name">Freelanzer</div>
          <div className="brand-sub">АЖ-49 · 2026</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Навигация</div>
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && (
              <span style={{
                background: 'var(--accent)', color: '#fff',
                borderRadius: 999, fontSize: 10, fontWeight: 700,
                padding: '1px 6px', minWidth: 18, textAlign: 'center'
              }}>
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="team-info">
          <div className="team-avatar">АЖ</div>
          <div>
            <div className="team-name">АЖ-49 командасы</div>
            <div className="team-status">
              <span className="online-dot"></span>
              Онлайн
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
