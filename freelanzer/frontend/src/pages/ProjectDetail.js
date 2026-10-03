import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, CheckSquare, Square } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { Skeleton } from '../components/Skeleton';

const CAT_LABELS = { web: 'Веб', mobile: 'Мобильное', design: 'Дизайн', bot: 'Бот', other: 'Другое' };
const STATUS_LABELS = { open: 'Открытый', in_progress: 'В работе', completed: 'Завершён', cancelled: 'Отменён' };
const PRIORITY_LABELS = { high: 'Высокий', medium: 'Средний', low: 'Низкий' };
const REQ_STATUS_LABELS = { new: 'Новый', in_progress: 'В работе', approved: 'Одобрен', rejected: 'Отклонён' };
const REQ_STATUS_COLORS = { new: 'var(--blue)', in_progress: 'var(--orange)', approved: 'var(--green)', rejected: 'var(--red)' };

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tab, setTab] = useState('proposals');
  const [form, setForm] = useState({ freelancer_name: '', cover_letter: '', bid_amount: '', delivery_days: '' });
  const [reqForm, setReqForm] = useState({ title: '', description: '', type: 'functional', priority: 'medium' });
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => axios.get(`/api/projects/${id}`).then(r => {
    setProject(r.data);
    setLoading(false);
  });

  useEffect(() => { load(); }, [id]);

  const submitProposal = async e => {
    e.preventDefault();
    setSubmitting(true);
    await axios.post(`/api/projects/${id}/proposals`, { ...form, freelancer_id: user?.id, freelancer_name: form.freelancer_name || user?.name });
    setForm({ freelancer_name: '', cover_letter: '', bid_amount: '', delivery_days: '' });
    await load();
    setSubmitting(false);
    setTab('proposals');
  };

  const submitReq = async e => {
    e.preventDefault();
    setSubmitting(true);
    await axios.post(`/api/projects/${id}/requirements`, reqForm);
    setReqForm({ title: '', description: '', type: 'functional', priority: 'medium' });
    await load();
    setSubmitting(false);
    setTab('requirements');
  };

  const deleteProject = async () => {
    if (!window.confirm('Удалить проект?')) return;
    await axios.delete(`/api/projects/${id}`);
    navigate('/projects');
  };

  const toggleMilestone = async (m) => {
    await axios.put(`/api/milestones/${m.id}`, { is_done: !m.is_done });
    await load();
  };

  const addMilestone = async e => {
    e.preventDefault();
    if (!milestoneTitle.trim()) return;
    await axios.post(`/api/projects/${id}/milestones`, { title: milestoneTitle });
    setMilestoneTitle('');
    await load();
  };

  const deleteMilestone = async (mid) => {
    await axios.delete(`/api/milestones/${mid}`);
    await load();
  };

  const canManage = user?.role === 'client' || user?.role === 'admin';

  if (loading) {
    return (
      <div>
        <Skeleton width={120} height={32} style={{ marginBottom: 24 }} />
        <Skeleton width="60%" height={28} style={{ marginBottom: 16 }} />
        <div className="detail-layout">
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
              <Skeleton width="80%" height={14} style={{ marginBottom: 8 }} />
              <Skeleton width="60%" height={14} />
            </div>
          </div>
          <div className="detail-sidebar">
            <div className="card">
              {[1,2,3,4].map(i => <Skeleton key={i} width="100%" height={40} style={{ marginBottom: 8 }} />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) return <div className="loading">Загрузка...</div>;

  const skills = project.skills ? project.skills.split(',').filter(Boolean) : [];
  const milestones = project.milestones || [];
  const doneMilestones = milestones.filter(m => m.is_done).length;
  const progress = project.progress ?? (milestones.length > 0 ? Math.round((doneMilestones / milestones.length) * 100) : 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link to="/projects" className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> Назад
        </Link>
        <span style={{ color: 'var(--text-3)', fontSize: 12 }}>/</span>
        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{project.title}</span>
      </div>

      <div className="page-header">
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span className={`badge badge-${project.category}`}>{CAT_LABELS[project.category]}</span>
            <span className={`badge badge-${project.status}`}>{STATUS_LABELS[project.status]}</span>
          </div>
          <h1 className="page-title">{project.title}</h1>
        </div>
        {canManage && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-danger btn-sm" onClick={deleteProject}>Удалить</button>
          </div>
        )}
      </div>

      <div className="detail-layout">
        {/* Main */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Description */}
          <div className="card">
            <p className="card-title">Описание проекта</p>
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7 }}>{project.description}</p>
            {skills.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Технологии</p>
                <div className="skills-list">
                  {skills.map((s, i) => <span key={i} className="skill-tag">{s.trim()}</span>)}
                </div>
              </div>
            )}
          </div>

          {/* Progress + Milestones */}
          <div className="card">
            <p className="card-title">Ход выполнения</p>

            {/* Progress bar */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Прогресс</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{progress}%</span>
              </div>
              <div style={{ height: 8, background: 'var(--surface2)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, var(--accent), var(--purple))',
                  borderRadius: 999,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              {milestones.length > 0 && (
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                  {doneMilestones} / {milestones.length} этапов выполнено
                </div>
              )}
            </div>

            {/* Milestones list */}
            {milestones.length === 0 && !canManage && (
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Нет этапов</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {milestones.map(m => (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px',
                  background: 'var(--surface2)', borderRadius: 8,
                  border: '1px solid var(--border)',
                  opacity: m.is_done ? 0.7 : 1,
                }}>
                  <button
                    onClick={() => toggleMilestone(m)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: m.is_done ? 'var(--green)' : 'var(--text-3)', display: 'flex' }}
                  >
                    {m.is_done ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                  <span style={{
                    flex: 1, fontSize: 13, color: 'var(--text)',
                    textDecoration: m.is_done ? 'line-through' : 'none',
                  }}>{m.title}</span>
                  {canManage && (
                    <button
                      onClick={() => deleteMilestone(m.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-3)', display: 'flex', borderRadius: 4 }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add milestone form */}
            {canManage && (
              <form onSubmit={addMilestone} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input
                  className="form-input"
                  placeholder="Название нового этапа..."
                  value={milestoneTitle}
                  onChange={e => setMilestoneTitle(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  <Plus size={14} /> Добавить
                </button>
              </form>
            )}
          </div>

          {/* Tabs */}
          <div>
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
              {[
                { key: 'proposals', label: `Предложения (${project.proposals?.length || 0})` },
                { key: 'requirements', label: `Требования (${project.requirements?.length || 0})` },
                { key: 'add-proposal', label: '+ Подать предложение' },
                { key: 'add-req', label: '+ Добавить требование' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    background: 'none', border: 'none',
                    padding: '8px 16px', fontSize: 13, fontWeight: 500,
                    color: tab === t.key ? 'var(--accent)' : 'var(--text-3)',
                    borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                    cursor: 'pointer', transition: 'all 0.15s', marginBottom: -1,
                  }}
                >{t.label}</button>
              ))}
            </div>

            {tab === 'proposals' && (
              <div>
                {project.proposals?.length === 0 && <div className="empty"><div className="empty-icon">📩</div><div>Нет предложений</div></div>}
                {project.proposals?.map(p => (
                  <div key={p.id} className="proposal-card">
                    <div className="proposal-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="client-avatar">{p.freelancer_name[0]}</div>
                        <span className="proposal-name">{p.freelancer_name}</span>
                      </div>
                      <span className={`badge badge-${p.status}`}>{p.status === 'pending' ? 'На рассмотрении' : p.status === 'accepted' ? 'Принято' : 'Отклонено'}</span>
                    </div>
                    <p className="proposal-text">{p.cover_letter}</p>
                    <div className="proposal-footer">
                      <span className="proposal-bid">{Number(p.bid_amount).toLocaleString()} ₸</span>
                      <span className="proposal-days">📅 {p.delivery_days} дн.</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'requirements' && (
              <div className="card">
                {project.requirements?.length === 0 && <div className="empty"><div className="empty-icon">📋</div><div>Нет требований</div></div>}
                {project.requirements?.map(r => (
                  <div key={r.id} className="req-item">
                    <div className="req-dot" style={{ background: REQ_STATUS_COLORS[r.status] || 'var(--text-3)' }}></div>
                    <div className="req-info">
                      <div className="req-title">{r.title}</div>
                      {r.description && <div className="req-desc">{r.description}</div>}
                      <div className="req-badges">
                        <span className={`badge badge-${r.type}`}>{r.type === 'functional' ? 'Функциональное' : 'Нефункциональное'}</span>
                        <span className={`badge badge-${r.priority}`}>{PRIORITY_LABELS[r.priority]}</span>
                        <span className={`badge badge-${r.status}`}>{REQ_STATUS_LABELS[r.status]}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'add-proposal' && (
              <div className="form-card">
                <div className="form-title">Подать предложение</div>
                <form onSubmit={submitProposal}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Ваше имя *</label>
                      <input className="form-input" placeholder="Иван Иванов" required
                        value={form.freelancer_name} onChange={e => setForm({ ...form, freelancer_name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Предлагаемая цена (₸) *</label>
                      <input className="form-input" type="number" placeholder="100000" required
                        value={form.bid_amount} onChange={e => setForm({ ...form, bid_amount: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Срок выполнения (дней) *</label>
                      <input className="form-input" type="number" placeholder="14" required
                        value={form.delivery_days} onChange={e => setForm({ ...form, delivery_days: e.target.value })} />
                    </div>
                    <div className="form-group full">
                      <label className="form-label">Сопроводительное письмо *</label>
                      <textarea className="form-textarea" placeholder="Почему именно вы должны выполнить этот проект..." required
                        value={form.cover_letter} onChange={e => setForm({ ...form, cover_letter: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Отправка...' : 'Отправить предложение'}</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setTab('proposals')}>Отмена</button>
                  </div>
                </form>
              </div>
            )}

            {tab === 'add-req' && (
              <div className="form-card">
                <div className="form-title">Добавить требование</div>
                <form onSubmit={submitReq}>
                  <div className="form-grid">
                    <div className="form-group full">
                      <label className="form-label">Название требования *</label>
                      <input className="form-input" placeholder="Аутентификация пользователей" required
                        value={reqForm.title} onChange={e => setReqForm({ ...reqForm, title: e.target.value })} />
                    </div>
                    <div className="form-group full">
                      <label className="form-label">Описание</label>
                      <textarea className="form-textarea" placeholder="Подробное описание..."
                        value={reqForm.description} onChange={e => setReqForm({ ...reqForm, description: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Тип</label>
                      <select className="form-select" value={reqForm.type} onChange={e => setReqForm({ ...reqForm, type: e.target.value })}>
                        <option value="functional">Функциональное</option>
                        <option value="non_functional">Нефункциональное</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Приоритет</label>
                      <select className="form-select" value={reqForm.priority} onChange={e => setReqForm({ ...reqForm, priority: e.target.value })}>
                        <option value="high">Высокий</option>
                        <option value="medium">Средний</option>
                        <option value="low">Низкий</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Добавление...' : 'Добавить требование'}</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setTab('requirements')}>Отмена</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="detail-sidebar">
          <div className="card">
            <p className="card-title">Информация о проекте</p>
            <div className="meta-list">
              <div className="meta-row">
                <span className="meta-key">💰 Бюджет</span>
                <span className="meta-val" style={{ color: 'var(--green)', fontWeight: 700 }}>{project.budget.toLocaleString()} ₸</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">👤 Заказчик</span>
                <span className="meta-val">{project.client_name}</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">📅 Дедлайн</span>
                <span className="meta-val">{project.deadline || '—'}</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">📁 Категория</span>
                <span className="meta-val">{CAT_LABELS[project.category]}</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">📊 Статус</span>
                <span className="meta-val"><span className={`badge badge-${project.status}`}>{STATUS_LABELS[project.status]}</span></span>
              </div>
              <div className="meta-row">
                <span className="meta-key">📩 Предложения</span>
                <span className="meta-val" style={{ color: 'var(--accent)', fontWeight: 700 }}>{project.proposals?.length || 0}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <p className="card-title">Быстрые действия</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => setTab('add-proposal')}>
                📩 Подать предложение
              </button>
              <button className="btn btn-secondary" style={{ justifyContent: 'center' }} onClick={() => setTab('add-req')}>
                📋 Добавить требование
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
