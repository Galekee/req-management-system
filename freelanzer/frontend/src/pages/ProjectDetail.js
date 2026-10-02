import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, User, Tag, Clock, CheckCircle } from 'lucide-react';
import axios from 'axios';

const CAT_LABELS = { web: 'Веб', mobile: 'Мобильді', design: 'Дизайн', bot: 'Бот', other: 'Басқа' };
const STATUS_LABELS = { open: 'Ашық', in_progress: 'Орындалуда', completed: 'Аяқталған', cancelled: 'Бас тартылған' };
const PRIORITY_LABELS = { high: 'Жоғары', medium: 'Орташа', low: 'Төмен' };
const REQ_STATUS_LABELS = { new: 'Жаңа', in_progress: 'Орындалуда', approved: 'Бекітілген', rejected: 'Қабылданбаған' };
const REQ_STATUS_COLORS = { new: 'var(--blue)', in_progress: 'var(--orange)', approved: 'var(--green)', rejected: 'var(--red)' };

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tab, setTab] = useState('proposals');
  const [form, setForm] = useState({ freelancer_name: '', cover_letter: '', bid_amount: '', delivery_days: '' });
  const [reqForm, setReqForm] = useState({ title: '', description: '', type: 'functional', priority: 'medium' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => axios.get(`/api/projects/${id}`).then(r => setProject(r.data));

  useEffect(() => { load(); }, [id]);

  const submitProposal = async e => {
    e.preventDefault();
    setSubmitting(true);
    await axios.post(`/api/projects/${id}/proposals`, form);
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
    if (!window.confirm('Жобаны жою керек пе?')) return;
    await axios.delete(`/api/projects/${id}`);
    navigate('/projects');
  };

  if (!project) return <div className="loading">Жүктелуде...</div>;

  const skills = project.skills ? project.skills.split(',').filter(Boolean) : [];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link to="/projects" className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> Артқа
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
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-danger btn-sm" onClick={deleteProject}>Жою</button>
        </div>
      </div>

      <div className="detail-layout">
        {/* Main */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Description */}
          <div className="card">
            <p className="card-title">Жоба сипаттамасы</p>
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7 }}>{project.description}</p>
            {skills.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Технологиялар</p>
                <div className="skills-list">
                  {skills.map((s, i) => <span key={i} className="skill-tag">{s.trim()}</span>)}
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div>
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
              {[
                { key: 'proposals', label: `Өтінімдер (${project.proposals?.length || 0})` },
                { key: 'requirements', label: `Талаптар (${project.requirements?.length || 0})` },
                { key: 'add-proposal', label: '+ Өтінім беру' },
                { key: 'add-req', label: '+ Талап қосу' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    background: 'none', border: 'none',
                    padding: '8px 16px',
                    fontSize: 13, fontWeight: 500,
                    color: tab === t.key ? 'var(--accent)' : 'var(--text-3)',
                    borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                    cursor: 'pointer', transition: 'all 0.15s',
                    marginBottom: -1,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'proposals' && (
              <div>
                {project.proposals?.length === 0 && <div className="empty"><div className="empty-icon">📩</div><div>Өтінім жоқ</div></div>}
                {project.proposals?.map(p => (
                  <div key={p.id} className="proposal-card">
                    <div className="proposal-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="client-avatar">{p.freelancer_name[0]}</div>
                        <span className="proposal-name">{p.freelancer_name}</span>
                      </div>
                      <span className={`badge badge-${p.status}`}>{p.status === 'pending' ? 'Қарауда' : p.status === 'accepted' ? 'Қабылданды' : 'Қабылданбады'}</span>
                    </div>
                    <p className="proposal-text">{p.cover_letter}</p>
                    <div className="proposal-footer">
                      <span className="proposal-bid">{Number(p.bid_amount).toLocaleString()} ₸</span>
                      <span className="proposal-days">📅 {p.delivery_days} күн</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'requirements' && (
              <div className="card">
                {project.requirements?.length === 0 && <div className="empty"><div className="empty-icon">📋</div><div>Талап жоқ</div></div>}
                {project.requirements?.map(r => (
                  <div key={r.id} className="req-item">
                    <div className="req-dot" style={{ background: REQ_STATUS_COLORS[r.status] || 'var(--text-3)' }}></div>
                    <div className="req-info">
                      <div className="req-title">{r.title}</div>
                      {r.description && <div className="req-desc">{r.description}</div>}
                      <div className="req-badges">
                        <span className={`badge badge-${r.type}`}>{r.type === 'functional' ? 'Функционалды' : 'Функционалды емес'}</span>
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
                <div className="form-title">Өтінім беру</div>
                <form onSubmit={submitProposal}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Атың *</label>
                      <input className="form-input" placeholder="Бекарыс Балапан" required value={form.freelancer_name} onChange={e => setForm({...form, freelancer_name: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ұсынылған баға (₸) *</label>
                      <input className="form-input" type="number" placeholder="100000" required value={form.bid_amount} onChange={e => setForm({...form, bid_amount: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Орындау мерзімі (күн) *</label>
                      <input className="form-input" type="number" placeholder="14" required value={form.delivery_days} onChange={e => setForm({...form, delivery_days: e.target.value})} />
                    </div>
                    <div className="form-group full">
                      <label className="form-label">Хат *</label>
                      <textarea className="form-textarea" placeholder="Неге сіздің жобаңызды мен жасауым керек..." required value={form.cover_letter} onChange={e => setForm({...form, cover_letter: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Жіберілуде...' : 'Өтінім жіберу'}</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setTab('proposals')}>Болдырмау</button>
                  </div>
                </form>
              </div>
            )}

            {tab === 'add-req' && (
              <div className="form-card">
                <div className="form-title">Талап қосу</div>
                <form onSubmit={submitReq}>
                  <div className="form-grid">
                    <div className="form-group full">
                      <label className="form-label">Талап атауы *</label>
                      <input className="form-input" placeholder="Пайдаланушы аутентификациясы" required value={reqForm.title} onChange={e => setReqForm({...reqForm, title: e.target.value})} />
                    </div>
                    <div className="form-group full">
                      <label className="form-label">Сипаттама</label>
                      <textarea className="form-textarea" placeholder="Толық сипаттама..." value={reqForm.description} onChange={e => setReqForm({...reqForm, description: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Түрі</label>
                      <select className="form-select" value={reqForm.type} onChange={e => setReqForm({...reqForm, type: e.target.value})}>
                        <option value="functional">Функционалды</option>
                        <option value="non_functional">Функционалды емес</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Басымдық</label>
                      <select className="form-select" value={reqForm.priority} onChange={e => setReqForm({...reqForm, priority: e.target.value})}>
                        <option value="high">Жоғары</option>
                        <option value="medium">Орташа</option>
                        <option value="low">Төмен</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Қосылуда...' : 'Талап қосу'}</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setTab('requirements')}>Болдырмау</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="detail-sidebar">
          <div className="card">
            <p className="card-title">Жоба ақпараты</p>
            <div className="meta-list">
              <div className="meta-row">
                <span className="meta-key">💰 Бюджет</span>
                <span className="meta-val" style={{ color: 'var(--green)', fontWeight: 700 }}>{project.budget.toLocaleString()} ₸</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">👤 Клиент</span>
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
                <span className="meta-key">📩 Өтінімдер</span>
                <span className="meta-val" style={{ color: 'var(--accent)', fontWeight: 700 }}>{project.proposals?.length || 0}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <p className="card-title">Жылдам іс-әрекет</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => setTab('add-proposal')}>
                📩 Өтінім беру
              </button>
              <button className="btn btn-secondary" style={{ justifyContent: 'center' }} onClick={() => setTab('add-req')}>
                📋 Талап қосу
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
