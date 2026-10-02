import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, ListChecks, PlusCircle, Settings } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import RequirementsList from './pages/RequirementsList';
import RequirementForm from './pages/RequirementForm';
import RequirementDetail from './pages/RequirementDetail';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/requirements" element={<RequirementsList />} />
            <Route path="/requirements/new" element={<RequirementForm />} />
            <Route path="/requirements/:id" element={<RequirementDetail />} />
            <Route path="/requirements/:id/edit" element={<RequirementForm />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function Sidebar() {
  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Дашборд' },
    { to: '/requirements', icon: <ListChecks size={20} />, label: 'Талаптар' },
    { to: '/requirements/new', icon: <PlusCircle size={20} />, label: 'Жаңа талап' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">ТБ</div>
        <div className="logo-text">
          <span className="logo-title">Талаптарды</span>
          <span className="logo-sub">басқару жүйесі</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="team-badge">
          <span className="team-dot"></span>
          АЖ-47 командасы
        </div>
      </div>
    </aside>
  );
}
