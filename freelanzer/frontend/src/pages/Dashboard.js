import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Briefcase, TrendingUp, Bell, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { Skeleton, SkeletonCard } from '../components/Skeleton';

const CAT_LABELS = { web: 'Веб', mobile: 'Мобильное', design: 'Дизайн', bot: 'Бот', other: 'Другое' };
const CAT_COLORS = { web: '#3b82f6', mobile: '#22c55e', design: '#a855f7', bot: '#f97316', other: '#eab308' };
const STATUS_LABELS = { open: 'Открытый', in_progress: 'В работе', completed: 'Завершён', cancelled: 'Отменён' };

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/stats?user_id=${user?.id}`).then(r => {
      setStats(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user?.id]);

  const isFreelancer = user?.role === 'freelancer';

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <Skeleton width={200} height={24} style={{ marginBottom: 8 }} />
            <Skeleton width={300} height={14} />
          </div>
        </div>
        <div className="stats-grid">
          {[1,2,3,4].map(i => (
            <div key={i} className="stat-card">
              <Skeleton width={36} height={36} style={{ borderRadius: 8, marginBottom: 14 }} />
              <Skeleton width={80} height={32} style={{ marginBottom: 6 }} />
              <Skeleton width={120} height={12} />
            </div>
          ))}
        </div>
        <div className="charts-grid">
          <SkeletonCard /><SkeletonCard />
        </div>
      </div>
    );
  }

  if (!stats) return <div className="empty">Нет данных</div>;

  const catData = (stats.byCategory || []).map(c => ({
    name: CAT_LABELS[c.category] || c.category,
    value: c.count,
    color: CAT_COLORS[c.category] || '#6366f1',
  }));

  const chartData = isFreelancer
    ? (stats.myEarnings || [])
    : (stats.monthlyProjects || []);

  const recentProjects = (stats.recentProjects || []).slice(0, 4);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Дашборд</h1>
          <p className="page-sub">Freelanzer · Общая сводка</p>
        </div>
        {!isFreelancer && (
          <Link to="/projects/new" className="btn btn-primary">+ Опубликовать проект</Link>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.12)' }}>
            <Briefcase size={18} color="#6366f1" />
          </div>
          <div className="stat-value">{stats.totalProjects ?? 0}</div>
          <div className="stat-label">Всего проектов</div>
          <div className="stat-change up">↑ Платформа</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.12)' }}>
            <TrendingUp size={18} color="#22c55e" />
          </div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{stats.activeProjects ?? stats.openProjects ?? 0}</div>
          <div className="stat-label">Активных проектов</div>
          <div className="stat-change up">↑ В работе</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.12)' }}>
            <Bell size={18} color="#ef4444" />
          </div>
          <div className="stat-value" style={{ color: 'var(--red)' }}>{stats.unreadCount ?? 0}</div>
          <div className="stat-label">Непрочитанных уведомлений</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.12)' }}>
            <MessageSquare size={18} color="#3b82f6" />
          </div>
          <div className="stat-value" style={{ color: 'var(--blue)' }}>{stats.unreadMessages ?? 0}</div>
          <div className="stat-label">Непрочитанных сообщений</div>
        </div>
      </div>

      {/* Area Chart */}
      <div className="charts-grid">
        <div className="card" style={{ gridColumn: chartData.length ? '1 / 2' : '1 / -1' }}>
          <p className="card-title">
            {isFreelancer ? 'Ежемесячный доход (₸)' : 'Новые проекты по месяцам'}
          </p>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey={isFreelancer ? 'amount' : 'count'}
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fill="url(#areaGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty" style={{ padding: 40 }}>Нет данных</div>
          )}
        </div>

        {catData.length > 0 && (
          <div className="card">
            <p className="card-title">По категориям</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {catData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
              {catData.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-3)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: e.color }}></div>
                  {e.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent projects */}
      {recentProjects.length > 0 && (
        <div className="card">
          <p className="card-title">Последние проекты</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {recentProjects.map((p, i) => (
              <Link key={p.id} to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: i < recentProjects.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'opacity 0.15s',
                }} onMouseEnter={e => e.currentTarget.style.opacity = '0.8'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: 'var(--accent-glow)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14
                    }}>📁</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.client_name}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className={`badge badge-${p.status}`}>{STATUS_LABELS[p.status]}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>{Number(p.budget).toLocaleString()} ₸</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Top freelancers */}
      {stats.topFreelancers?.length > 0 && (
        <div className="card" style={{ marginTop: 14 }}>
          <p className="card-title">Активные фрилансеры</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {stats.topFreelancers.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < stats.topFreelancers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: `hsl(${i * 60 + 240}, 70%, 60%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                    {f.freelancer_name[0]}
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{f.freelancer_name}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{f.count} заявок</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
