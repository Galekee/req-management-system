import React, { useEffect, useState } from 'react';
import { Search, MapPin, Send, Edit3, Check, Plus, Trash2, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const STATUS_LABELS = { open: 'Открытый', in_progress: 'В работе', completed: 'Завершён' };
const CAT_LABELS = { web: 'Веб', mobile: 'Мобильное', design: 'Дизайн', bot: 'Бот', other: 'Другое' };
const PROPOSAL_STATUS_LABELS = { pending: 'На рассмотрении', accepted: '✅ Принято', rejected: '❌ Отклонено' };

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('browse');
  const [projects, setProjects] = useState([]);
  const [myProposals, setMyProposals] = useState([]);
  const [profile, setProfile] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [search, setSearch] = useState('');
  const [applyForm, setApplyForm] = useState({ projectId: null, cover_letter: '', bid_amount: '', delivery_days: '' });
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [portForm, setPortForm] = useState({ title: '', description: '', tech: '', url: '' });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [projRes, profRes] = await Promise.all([
      axios.get('/api/projects?status=open'),
      axios.get(`/api/freelancers/by-user/${user.id}`).catch(() => ({ data: null })),
    ]);
    setProjects(projRes.data);
    setProfile(profRes.data);
    if (profRes.data) {
      setProfileForm({ name: profRes.data.name, title: profRes.data.title, bio: profRes.data.bio, skills: profRes.data.skills, hourly_rate: profRes.data.hourly_rate, location: profRes.data.location });
      setPortfolio(profRes.data.portfolio || []);
      // load my proposals
      const myRes = await axios.get(`/api/freelancers/${profRes.data.id}/proposals`);
      setMyProposals(myRes.data);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submitProposal = async e => {
    e.preventDefault();
    setSubmitting(true);
    await axios.post(`/api/projects/${applyForm.projectId}/proposals`, {
      freelancer_name: user.name,
      freelancer_id: user.id,
      cover_letter: applyForm.cover_letter,
      bid_amount: applyForm.bid_amount,
      delivery_days: applyForm.delivery_days,
    });
    setApplyForm({ projectId: null, cover_letter: '', bid_amount: '', delivery_days: '' });
    await load();
    setTab('proposals');
    setSubmitting(false);
  };

  const saveProfile = async e => {
    e.preventDefault();
    setSubmitting(true);
    await axios.put(`/api/freelancers/${profile.id}`, profileForm);
    setEditProfile(false);
    await load();
    setSubmitting(false);
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  // Blocked freelancer
  if (!profile?.is_approved) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <h2 style={{ color: 'var(--text-1)', marginBottom: 8 }}>Ваша регистрация проверяется</h2>
          <p style={{ color: 'var(--text-3)', lineHeight: 1.6 }}>
            Администратор проверяет ваш профиль. После одобрения вы сможете искать работу.
          </p>
        </div>
      </div>
    );
  }

  const filtered = projects.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.skills.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  // Check if already applied
  const appliedIds = new Set(myProposals.map(p => p.project_id));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Кабинет фрилансера</h1>
          <p className="page-sub">Привет, {user.name}! Найдите работу</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {[
          { key: 'browse', label: `Поиск работы (${projects.length})` },
          { key: 'proposals', label: `Мои предложения (${myProposals.length})` },
          { key: 'portfolio', label: `Портфолио (${portfolio.length})` },
          { key: 'profile', label: 'Профиль' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: 'none', border: 'none', padding: '10px 18px', fontSize: 13, fontWeight: 600,
            color: tab === t.key ? 'var(--accent)' : 'var(--text-3)',
            borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
            cursor: 'pointer', marginBottom: -1
          }}>{t.label}</button>
        ))}
      </div>

      {/* Browse projects */}
      {tab === 'browse' && (
        <div>
          <div style={{ marginBottom: 16, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Поиск по названию проекта, технологии..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {applyForm.projectId && (
            <div className="form-card" style={{ marginBottom: 16 }}>
              <div className="form-title">Отправить предложение</div>
              <form onSubmit={submitProposal}>
                <div className="form-grid">
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Предлагаемая цена (₸) *</label>
                    <input className="form-input" type="number" placeholder="100000" required
                      value={applyForm.bid_amount} onChange={e => setApplyForm({ ...applyForm, bid_amount: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Срок выполнения (дней) *</label>
                    <input className="form-input" type="number" placeholder="14" required
                      value={applyForm.delivery_days} onChange={e => setApplyForm({ ...applyForm, delivery_days: e.target.value })} />
                  </div>
                  <div className="form-group full" style={{ marginBottom: 12 }}>
                    <label className="form-label">Сопроводительное письмо *</label>
                    <textarea className="form-textarea" placeholder="Почему вы можете выполнить этот проект..." required
                      value={applyForm.cover_letter} onChange={e => setApplyForm({ ...applyForm, cover_letter: e.target.value })} />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    <Send size={13} /> {submitting ? 'Отправка...' : 'Отправить предложение'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setApplyForm({ projectId: null, cover_letter: '', bid_amount: '', delivery_days: '' })}>Отмена</button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(p => {
              const skills = p.skills ? p.skills.split(',').filter(Boolean) : [];
              const applied = appliedIds.has(p.id);
              return (
                <div key={p.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)', marginBottom: 4 }}>{p.title}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span className={`badge badge-${p.category}`}>{CAT_LABELS[p.category]}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--green)' }}>{Number(p.budget).toLocaleString()} ₸</div>
                      {p.deadline && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>📅 {p.deadline}</div>}
                    </div>
                  </div>

                  <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 10,
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {p.description}
                  </p>

                  {skills.length > 0 && (
                    <div className="skills-list" style={{ marginBottom: 12 }}>
                      {skills.map((s, i) => <span key={i} className="skill-tag">{s.trim()}</span>)}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>👤 {p.client_name}</span>
                    {applied ? (
                      <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Check size={13} /> Предложение отправлено
                      </span>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => setApplyForm({ projectId: p.id, cover_letter: '', bid_amount: '', delivery_days: '' })}>
                        <Send size={12} /> Подать предложение
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My proposals */}
      {tab === 'proposals' && (
        <div>
          {myProposals.length === 0 && (
            <div className="empty"><div className="empty-icon">📩</div><div>Нет предложений</div></div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myProposals.map(p => (
              <div key={p.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>{p.project_title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                      {Number(p.bid_amount).toLocaleString()} ₸ · {p.delivery_days} дн.
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
                    background: p.status === 'accepted' ? '#10b98122' : p.status === 'rejected' ? '#ef444422' : '#f59e0b22',
                    color: p.status === 'accepted' ? '#10b981' : p.status === 'rejected' ? '#ef4444' : '#f59e0b'
                  }}>{PROPOSAL_STATUS_LABELS[p.status]}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{p.cover_letter}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio tab */}
      {tab === 'portfolio' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowPortfolioForm(o => !o)}>
              <Plus size={13} /> Добавить работу
            </button>
          </div>

          {showPortfolioForm && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="form-title" style={{ marginBottom: 12 }}>Новая работа</div>
              <form onSubmit={async e => {
                e.preventDefault();
                setSubmitting(true);
                await axios.post(`/api/freelancers/${profile.id}/portfolio`, portForm);
                setPortForm({ title: '', description: '', tech: '', url: '' });
                setShowPortfolioForm(false);
                await load();
                setSubmitting(false);
              }}>
                <div className="form-grid" style={{ gap: 12 }}>
                  <div className="form-group full">
                    <label className="form-label">Название *</label>
                    <input className="form-input" required placeholder="E-commerce сайт"
                      value={portForm.title} onChange={e => setPortForm({ ...portForm, title: e.target.value })} />
                  </div>
                  <div className="form-group full">
                    <label className="form-label">Описание</label>
                    <textarea className="form-textarea" style={{ minHeight: 70 }} placeholder="О работе..."
                      value={portForm.description} onChange={e => setPortForm({ ...portForm, description: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Технологии</label>
                    <input className="form-input" placeholder="React, Node.js"
                      value={portForm.tech} onChange={e => setPortForm({ ...portForm, tech: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ссылка</label>
                    <input className="form-input" placeholder="https://..."
                      value={portForm.url} onChange={e => setPortForm({ ...portForm, url: e.target.value })} />
                  </div>
                </div>
                <div className="form-actions" style={{ marginTop: 12 }}>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                    {submitting ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPortfolioForm(false)}>Отмена</button>
                </div>
              </form>
            </div>
          )}

          {portfolio.length === 0 && !showPortfolioForm && (
            <div className="empty"><div className="empty-icon">💼</div><div>Нет портфолио</div></div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {portfolio.map(item => {
              const techs = item.tech ? item.tech.split(',').filter(Boolean) : [];
              return (
                <div key={item.id} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 16,
                  display: 'flex', flexDirection: 'column', gap: 10, position: 'relative',
                }}>
                  <button onClick={async () => {
                    await axios.delete(`/api/portfolio/${item.id}`);
                    await load();
                  }} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
                    <Trash2 size={14} />
                  </button>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', paddingRight: 20 }}>{item.title}</div>
                  {item.description && <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>{item.description}</p>}
                  {techs.length > 0 && (
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {techs.map((t, i) => <span key={i} className="skill-tag" style={{ fontSize: 10 }}>{t.trim()}</span>)}
                    </div>
                  )}
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm" style={{ justifyContent: 'center', marginTop: 'auto' }}>
                      <ExternalLink size={12} /> Посмотреть
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Profile */}
      {tab === 'profile' && profile && (
        <div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p className="card-title" style={{ marginBottom: 0 }}>Мой профиль</p>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditProfile(!editProfile)}>
                <Edit3 size={13} /> {editProfile ? 'Отмена' : 'Редактировать'}
              </button>
            </div>

            {!editProfile ? (
              <div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: 14,
                    background: profile.avatar_color, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 700, color: '#fff'
                  }}>{profile.name[0]}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-1)' }}>{profile.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 4 }}>{profile.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', gap: 12 }}>
                      <span><MapPin size={11} style={{ display: 'inline' }} /> {profile.location}</span>
                      <span>💰 {Number(profile.hourly_rate).toLocaleString()} ₸/час</span>
                    </div>
                  </div>
                </div>
                {profile.bio && <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 12 }}>{profile.bio}</p>}
                {profile.skills && (
                  <div className="skills-list">
                    {profile.skills.split(',').filter(Boolean).map((s, i) => <span key={i} className="skill-tag">{s.trim()}</span>)}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>{profile.jobs_done}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Выполненных проектов</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>{Number(profile.total_earned).toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Общий доход ₸</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>{profile.avgRating || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Рейтинг</div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={saveProfile}>
                <div className="form-grid">
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Имя</label>
                    <input className="form-input" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Специальность</label>
                    <input className="form-input" value={profileForm.title} onChange={e => setProfileForm({ ...profileForm, title: e.target.value })} />
                  </div>
                  <div className="form-group full" style={{ marginBottom: 12 }}>
                    <label className="form-label">О себе</label>
                    <textarea className="form-textarea" value={profileForm.bio} onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })} />
                  </div>
                  <div className="form-group full" style={{ marginBottom: 12 }}>
                    <label className="form-label">Технологии (через запятую)</label>
                    <input className="form-input" value={profileForm.skills} onChange={e => setProfileForm({ ...profileForm, skills: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Ставка в час (₸)</label>
                    <input className="form-input" type="number" value={profileForm.hourly_rate} onChange={e => setProfileForm({ ...profileForm, hourly_rate: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Город</label>
                    <input className="form-input" value={profileForm.location} onChange={e => setProfileForm({ ...profileForm, location: e.target.value })} />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
