import React, { useEffect, useState, useCallback } from 'react';
import { Users, Briefcase, BarChart2, Shield, CheckCircle, XCircle, Trash2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { SkeletonCard } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { useAuth } from '../AuthContext';

const ROLE_LABELS = { admin: 'Админ', client: 'Клиент', freelancer: 'Фрилансер' };
const ROLE_COLORS = { admin: '#ef4444', client: '#6366f1', freelancer: '#10b981' };
const STATUS_LABELS = { open: 'Открытый', in_progress: 'В процессе', completed: 'Завершён' };
const STATUS_COLORS = { open: '#6366f1', in_progress: '#f59e0b', completed: '#10b981' };

export default function AdminPanel() {
  const { user: me } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const showToast = (msg, type) => type === 'success' ? toastSuccess(msg) : toastError(msg);
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, projectsRes, statsRes] = await Promise.all([
        axios.get('/api/admin/users'),
        axios.get('/api/projects'),
        axios.get('/api/stats'),
      ]);
      setUsers(usersRes.data);
      setProjects(projectsRes.data);
      setStats(statsRes.data);
    } catch {
      showToast('Ошибка загрузки данных', 'error');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const approve = async (id) => {
    try {
      await axios.put(`/api/admin/users/${id}/approve`);
      showToast('Фрилансер одобрен', 'success');
      loadAll();
    } catch {
      showToast('Ошибка одобрения', 'error');
    }
  };

  const reject = async (id) => {
    try {
      await axios.put(`/api/admin/users/${id}/reject`);
      showToast('Пользователь заблокирован', 'success');
      loadAll();
    } catch {
      showToast('Произошла ошибка', 'error');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Удалить пользователя?')) return;
    try {
      await axios.delete(`/api/admin/users/${id}`);
      showToast('Пользователь удалён', 'success');
      loadAll();
    } catch {
      showToast('Ошибка удаления', 'error');
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm('Удалить проект?')) return;
    try {
      await axios.delete(`/api/projects/${id}`);
      showToast('Проект удалён', 'success');
      loadAll();
    } catch {
      showToast('Ошибка удаления', 'error');
    }
  };

  const pendingCount = users.filter(u => u.role === 'freelancer' && !u.is_approved).length;

  const TABS = [
    { key: 'users', label: 'Все пользователи', icon: <Users size={15} /> },
    { key: 'projects', label: 'Все проекты', icon: <Briefcase size={15} /> },
    { key: 'stats', label: 'Статистика', icon: <BarChart2 size={15} /> },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Shield size={20} color="var(--accent)" />
            <h1 className="page-title" style={{ margin: 0 }}>Панель администратора</h1>
          </div>
          <p className="page-sub">Центр управления платформой</p>
        </div>
      </div>

      {/* Warning banner for pending approvals */}
      {pendingCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#f59e0b18', border: '1px solid #f59e0b55',
          borderRadius: 10, padding: '10px 16px', marginBottom: 20,
          color: '#f59e0b', fontWeight: 600, fontSize: 13
        }}>
          <AlertTriangle size={16} />
          ⚠️ {pendingCount} фрилансер ожидают одобрения
        </div>
      )}

      {/* Pill Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="tab-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 600,
              border: tab === t.key ? 'none' : '1px solid var(--border)',
              background: tab === t.key ? 'var(--accent)' : 'var(--surface)',
              color: tab === t.key ? '#fff' : 'var(--text-2)',
              cursor: 'pointer', transition: 'all 0.15s'
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Users */}
      {tab === 'users' && (
        loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {users.length === 0 && (
              <div className="empty"><div className="empty-icon">👥</div><div>Нет пользователей</div></div>
            )}
            {users.map(u => (
              <div key={u.id} className="card" style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px'
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                  background: (ROLE_COLORS[u.role] || '#888') + '22',
                  color: ROLE_COLORS[u.role] || '#888',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 17
                }}>
                  {u.name?.[0] || '?'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>{u.name}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                      background: (ROLE_COLORS[u.role] || '#888') + '22',
                      color: ROLE_COLORS[u.role] || '#888'
                    }}>{ROLE_LABELS[u.role] || u.role}</span>
                    {u.role === 'freelancer' && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                        background: u.is_approved ? '#10b98122' : '#f59e0b22',
                        color: u.is_approved ? '#10b981' : '#f59e0b'
                      }}>{u.is_approved ? 'Одобрен' : 'На проверке'}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{u.email}</div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {u.role === 'freelancer' && !u.is_approved && (
                    <button className="btn btn-primary btn-sm" onClick={() => approve(u.id)} style={{ gap: 4 }}>
                      <CheckCircle size={13} /> Одобрить
                    </button>
                  )}
                  {u.role === 'freelancer' && u.is_approved && (
                    <button className="btn btn-secondary btn-sm" onClick={() => reject(u.id)} style={{ gap: 4 }}>
                      <XCircle size={13} /> Отклонить
                    </button>
                  )}
                  {u.id !== me?.id && (
                    <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)} title="Удалить">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Tab: Projects */}
      {tab === 'projects' && (
        loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {projects.length === 0 && (
              <div className="empty"><div className="empty-icon">📁</div><div>Нет проектов</div></div>
            )}
            {projects.map(p => (
              <div key={p.id} className="card" style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px'
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                  background: 'var(--accent)22', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Briefcase size={18} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>{p.title}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                      background: (STATUS_COLORS[p.status] || '#888') + '22',
                      color: STATUS_COLORS[p.status] || '#888'
                    }}>{STATUS_LABELS[p.status] || p.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                    {p.client_name} · {p.category} · {p.budget?.toLocaleString()} ₸
                  </div>
                </div>

                <button className="btn btn-danger btn-sm" onClick={() => deleteProject(p.id)} title="Удалить">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* Tab: Stats */}
      {tab === 'stats' && (
        loading || !stats ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
            {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div>
            {/* Users by role */}
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Пользователи</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
              {[
                { label: 'Всего', value: stats.totalUsers, color: 'var(--accent)' },
                { label: 'На проверке', value: stats.pendingApprovals, color: '#f59e0b' },
                { label: 'Всего предложений', value: stats.totalProposals, color: '#a855f7' },
              ].map((s, i) => (
                <div key={i} className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value ?? 0}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Projects by status */}
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Проекты</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
              <div className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent)' }}>{stats.totalProjects ?? 0}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>Всего проектов</div>
              </div>
              {(stats.byStatus || []).map((s, i) => (
                <div key={i} className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: STATUS_COLORS[s.status] || '#888' }}>{s.count}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>{STATUS_LABELS[s.status] || s.status}</div>
                </div>
              ))}
            </div>

            {/* By category */}
            {stats.byCategory?.length > 0 && (
              <>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>По категориям</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                  {stats.byCategory.map((c, i) => (
                    <div key={i} className="card" style={{ textAlign: 'center', padding: '14px 10px' }}>
                      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)' }}>{c.count}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{c.category}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )
      )}
    </div>
  );
}
