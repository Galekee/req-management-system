import React, { useEffect, useState } from 'react';
import { Users, Briefcase, CheckCircle, XCircle, Trash2, Shield } from 'lucide-react';
import axios from 'axios';

const ROLE_LABELS = { admin: 'Админ', client: 'Клиент', freelancer: 'Фрилансер' };
const ROLE_COLORS = { admin: '#ef4444', client: '#6366f1', freelancer: '#10b981' };

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [tab, setTab] = useState('pending');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [usersRes, statsRes] = await Promise.all([
      axios.get('/api/admin/users'),
      axios.get('/api/stats'),
    ]);
    setUsers(usersRes.data);
    setStats(statsRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    await axios.put(`/api/admin/users/${id}/approve`);
    load();
  };

  const reject = async (id) => {
    await axios.put(`/api/admin/users/${id}/reject`);
    load();
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Пайдаланушыны жою керек пе?')) return;
    await axios.delete(`/api/admin/users/${id}`);
    load();
  };

  if (loading) return <div className="loading">Жүктелуде...</div>;

  const pending = users.filter(u => u.role === 'freelancer' && !u.is_approved);
  const allUsers = users.filter(u => u.role !== 'admin');
  const display = tab === 'pending' ? pending : allUsers;

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Shield size={20} color="var(--accent)" />
            <h1 className="page-title" style={{ margin: 0 }}>Админ панелі</h1>
          </div>
          <p className="page-sub">Пайдаланушыларды басқару және бекіту</p>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Барлық жобалар', value: stats.totalProjects, color: 'var(--accent)' },
          { label: 'Жалпы пайдаланушы', value: stats.totalUsers, color: '#10b981' },
          { label: 'Күту тізімі', value: stats.pendingApprovals, color: '#f59e0b' },
          { label: 'Барлық өтінімдер', value: stats.totalProposals, color: '#a855f7' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value ?? 0}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {[
          { key: 'pending', label: `Күту тізімі (${pending.length})` },
          { key: 'all', label: `Барлық пайдаланушылар (${allUsers.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: 'none', border: 'none', padding: '10px 20px', fontSize: 13, fontWeight: 600,
            color: tab === t.key ? 'var(--accent)' : 'var(--text-3)',
            borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
            cursor: 'pointer', marginBottom: -1
          }}>{t.label}</button>
        ))}
      </div>

      {display.length === 0 && (
        <div className="empty">
          <div className="empty-icon">{tab === 'pending' ? '✅' : '👥'}</div>
          <div>{tab === 'pending' ? 'Күту тізімі бос' : 'Пайдаланушы жоқ'}</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {display.map(u => (
          <div key={u.id} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px', background: 'var(--bg-1)',
            border: '1px solid var(--border)', borderRadius: 12
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: ROLE_COLORS[u.role] + '22', color: ROLE_COLORS[u.role],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 16
            }}>
              {u.name[0]}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>{u.name}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                  background: ROLE_COLORS[u.role] + '22', color: ROLE_COLORS[u.role]
                }}>{ROLE_LABELS[u.role]}</span>
                {u.role === 'freelancer' && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                    background: u.is_approved ? '#10b98122' : '#f59e0b22',
                    color: u.is_approved ? '#10b981' : '#f59e0b'
                  }}>{u.is_approved ? 'Бекітілді' : 'Күтуде'}</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{u.email}</div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {u.role === 'freelancer' && !u.is_approved && (
                <button className="btn btn-primary btn-sm" onClick={() => approve(u.id)}
                  title="Бекіту" style={{ gap: 4 }}>
                  <CheckCircle size={14} /> Бекіту
                </button>
              )}
              {u.role === 'freelancer' && u.is_approved && (
                <button className="btn btn-secondary btn-sm" onClick={() => reject(u.id)}
                  title="Блоктау" style={{ gap: 4 }}>
                  <XCircle size={14} /> Блоктау
                </button>
              )}
              <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}
                title="Жою">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
