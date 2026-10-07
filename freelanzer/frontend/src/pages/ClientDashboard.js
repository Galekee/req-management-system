import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, CheckCircle, XCircle, Clock, Briefcase } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const STATUS_LABELS = { open: 'Открытый', in_progress: 'В работе', completed: 'Завершён', cancelled: 'Отменён' };
const PROPOSAL_STATUS = { pending: 'На рассмотрении', accepted: 'Принято', rejected: 'Отклонено' };

export default function ClientDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await axios.get(`/api/projects?client_id=${user.id}`);
    setProjects(res.data);
    if (selected) {
      const detail = await axios.get(`/api/projects/${selected.id}`);
      setSelected(detail.data);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const selectProject = async (p) => {
    const res = await axios.get(`/api/projects/${p.id}`);
    setSelected(res.data);
  };

  const updateProposal = async (proposalId, status) => {
    await axios.put(`/api/proposals/${proposalId}/status`, { status });
    // reload selected project
    const res = await axios.get(`/api/projects/${selected.id}`);
    setSelected(res.data);
    load();
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);

  return (
    <div>
      {/* Profile card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 800, color: '#fff'
        }}>{user.name?.[0]}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>{user.name}</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(99,102,241,0.15)', color: 'var(--accent)' }}>Клиент</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 8 }}>{user.email}</div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{projects.length}</span>
              <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 5 }}>проектов</span>
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--green)' }}>{totalBudget.toLocaleString()} ₸</span>
              <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 5 }}>общий бюджет</span>
            </div>
          </div>
        </div>
        <Link to="/projects/new" className="btn btn-primary">
          <PlusCircle size={14} /> Новый проект
        </Link>
      </div>

      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="page-title">Мои проекты</h1>
          <p className="page-sub">Управляйте своими проектами</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.6fr' : '1fr', gap: 20 }}>
        {/* Projects list */}
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
            Мои проекты ({projects.length})
          </p>

          {projects.length === 0 && (
            <div className="empty">
              <div className="empty-icon">📁</div>
              <div>Нет проектов</div>
              <Link to="/projects/new" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Опубликовать проект</Link>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {projects.map(p => (
              <div key={p.id}
                onClick={() => selectProject(p)}
                style={{
                  padding: '14px 16px', background: selected?.id === p.id ? 'var(--bg-2)' : 'var(--bg-1)',
                  border: `1px solid ${selected?.id === p.id ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s'
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)', marginBottom: 4 }}>{p.title}</div>
                  <span className={`badge badge-${p.status}`} style={{ fontSize: 10, flexShrink: 0 }}>{STATUS_LABELS[p.status]}</span>
                </div>
                <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-3)' }}>
                  <span>💰 {Number(p.budget).toLocaleString()} ₸</span>
                  <span><Briefcase size={11} style={{ display: 'inline', marginRight: 3 }} />{p.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project detail + proposals */}
        {selected && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Предложения ({selected.proposals?.length || 0})
              </p>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 12 }}>✕ Закрыть</button>
            </div>

            <div className="card" style={{ marginBottom: 12 }}>
              <p className="card-title">{selected.title}</p>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{selected.description}</p>
            </div>

            {selected.proposals?.length === 0 && (
              <div className="empty"><div className="empty-icon">📩</div><div>Предложений пока нет</div></div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selected.proposals?.map(p => (
                <div key={p.id} className="proposal-card">
                  <div className="proposal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="client-avatar">{p.freelancer_name[0]}</div>
                      <div>
                        <div className="proposal-name">{p.freelancer_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.delivery_days} дн. · {Number(p.bid_amount).toLocaleString()} ₸</div>
                      </div>
                    </div>
                    <span className={`badge badge-${p.status}`} style={{ fontSize: 10 }}>
                      {PROPOSAL_STATUS[p.status] || p.status}
                    </span>
                  </div>
                  <p className="proposal-text">{p.cover_letter}</p>

                  {p.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button className="btn btn-primary btn-sm" style={{ gap: 4 }} onClick={() => updateProposal(p.id, 'accepted')}>
                        <CheckCircle size={13} /> Принять
                      </button>
                      <button className="btn btn-danger btn-sm" style={{ gap: 4 }} onClick={() => updateProposal(p.id, 'rejected')}>
                        <XCircle size={13} /> Отклонить
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
