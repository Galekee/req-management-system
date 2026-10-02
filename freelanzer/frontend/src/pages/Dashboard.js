import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Briefcase, Users, FileText, TrendingUp } from 'lucide-react';
import axios from 'axios';

const CAT_LABELS = { web: 'Веб', mobile: 'Мобильді', design: 'Дизайн', bot: 'Бот', other: 'Басқа' };
const CAT_COLORS = { web: '#3b82f6', mobile: '#22c55e', design: '#a855f7', bot: '#f97316', other: '#eab308' };
const STATUS_LABELS = { open: 'Ашық', in_progress: 'Орындалуда', completed: 'Аяқталған', cancelled: 'Бас тартылған' };
const STATUS_COLORS = { open: '#22c55e', in_progress: '#3b82f6', completed: '#a855f7', cancelled: '#ef4444' };

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get('/api/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) return <div className="loading">Жүктелуде...</div>;

  const catData = stats.byCategory.map(c => ({ name: CAT_LABELS[c.category] || c.category, value: c.count, color: CAT_COLORS[c.category] || '#6366f1' }));
  const statusData = stats.byStatus.map(s => ({ name: STATUS_LABELS[s.status] || s.status, count: s.count, color: STATUS_COLORS[s.status] || '#6366f1' }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Дашборд</h1>
          <p className="page-sub">Freelanzer · АЖ-49 жобасының жалпы жай-күйі</p>
        </div>
        <Link to="/projects/new" className="btn btn-primary">
          + Жоба жариялау
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.12)' }}>
            <Briefcase size={18} color="#6366f1" />
          </div>
          <div className="stat-value">{stats.totalProjects}</div>
          <div className="stat-label">Барлық жобалар</div>
          <div className="stat-change up">↑ Белсенді платформа</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.12)' }}>
            <TrendingUp size={18} color="#22c55e" />
          </div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{stats.openProjects}</div>
          <div className="stat-label">Ашық жобалар</div>
          <div className="stat-change up">↑ Өтінім қабылдауда</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.12)' }}>
            <Users size={18} color="#3b82f6" />
          </div>
          <div className="stat-value" style={{ color: 'var(--blue)' }}>{stats.totalProposals}</div>
          <div className="stat-label">Барлық өтінімдер</div>
          <div className="stat-change up">↑ Фрилансерлер белсенді</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(168,85,247,0.12)' }}>
            <FileText size={18} color="#a855f7" />
          </div>
          <div className="stat-value" style={{ color: 'var(--purple)' }}>{stats.totalRequirements}</div>
          <div className="stat-label">Талаптар саны</div>
          <div className="stat-change up">↑ Жобалар бойынша</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <p className="card-title">Категория бойынша</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={catData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} dataKey="value" paddingAngle={3}>
                {catData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
            {catData.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-3)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: e.color }}></div>
                {e.name}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <p className="card-title">Статус бойынша</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData} barSize={32}>
              <XAxis dataKey="name" tick={{ fill: '#4b4f66', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#4b4f66', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontSize: 12 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {stats.topFreelancers.length > 0 && (
        <div className="card">
          <p className="card-title">Белсенді фрилансерлер</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {stats.topFreelancers.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < stats.topFreelancers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: `hsl(${i * 60 + 240}, 70%, 60%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                    {f.freelancer_name[0]}
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{f.freelancer_name}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{f.count} өтінім</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
