import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';

const STATUS_LABELS = { new: 'Жаңа', in_progress: 'Орындалуда', approved: 'Бекітілген', rejected: 'Қабылданбаған', on_hold: 'Тоқтатылған' };
const STATUS_COLORS = { new: '#60a5fa', in_progress: '#a5b4fc', approved: '#86efac', rejected: '#fca5a5', on_hold: '#fdba74' };
const PRIORITY_COLORS = { high: '#f87171', medium: '#fb923c', low: '#4ade80' };
const PRIORITY_LABELS = { high: 'Жоғары', medium: 'Орташа', low: 'Төмен' };

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/requirements/stats')
      .then(r => { setStats(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Жүктелуде...</div>;
  if (!stats) return <div className="loading">Деректер жоқ</div>;

  const statusData = stats.byStatus.map(s => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] || '#94a3b8'
  }));

  const priorityData = stats.byPriority.map(p => ({
    name: PRIORITY_LABELS[p.priority] || p.priority,
    count: p.count,
    color: PRIORITY_COLORS[p.priority] || '#94a3b8'
  }));

  const assigneeData = stats.byAssignee.map(a => ({
    name: a.assignee,
    count: a.count
  }));

  const approved = stats.byStatus.find(s => s.status === 'approved')?.count || 0;
  const inProgress = stats.byStatus.find(s => s.status === 'in_progress')?.count || 0;
  const functional = stats.byType.find(t => t.type === 'functional')?.count || 0;
  const nonFunctional = stats.byType.find(t => t.type === 'non_functional')?.count || 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Дашборд</h1>
          <p className="page-subtitle">Талаптарды басқару жүйесінің жалпы көрінісі</p>
        </div>
        <Link to="/requirements/new" className="btn btn-primary">
          + Жаңа талап
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Барлық талаптар</span>
          <span className="stat-value">{stats.total}</span>
          <span className="stat-badge" style={{ background: '#1e3a5f', color: '#60a5fa' }}>Жалпы</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Бекітілген</span>
          <span className="stat-value" style={{ color: '#86efac' }}>{approved}</span>
          <span className="stat-badge" style={{ background: '#14532d', color: '#86efac' }}>
            {stats.total ? Math.round(approved / stats.total * 100) : 0}%
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Орындалуда</span>
          <span className="stat-value" style={{ color: '#a5b4fc' }}>{inProgress}</span>
          <span className="stat-badge" style={{ background: '#312e81', color: '#a5b4fc' }}>Белсенді</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Функционалды</span>
          <span className="stat-value">{functional}</span>
          <span className="stat-badge" style={{ background: '#1e3a5f', color: '#60a5fa' }}>ФТ</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Функционалды емес</span>
          <span className="stat-value">{nonFunctional}</span>
          <span className="stat-badge" style={{ background: '#2d1b69', color: '#c4b5fd' }}>ФЕТ</span>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <p className="chart-title">Статус бойынша бөлу</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
              <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <p className="chart-title">Басымдық бойынша</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityData} barSize={36}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {assigneeData.length > 0 && (
          <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
            <p className="chart-title">Орындаушы бойынша</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={assigneeData} barSize={48} layout="vertical">
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 13 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
