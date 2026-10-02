import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, PlusCircle, Users, ChevronRight } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import NewProject from './pages/NewProject';
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
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function Sidebar() {
  const nav = [
    { to: '/', icon: <LayoutDashboard size={18} />, label: 'Дашборд' },
    { to: '/projects', icon: <Briefcase size={18} />, label: 'Жобалар' },
    { to: '/projects/new', icon: <PlusCircle size={18} />, label: 'Жоба жариялау' },
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
            <span>{item.label}</span>
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
