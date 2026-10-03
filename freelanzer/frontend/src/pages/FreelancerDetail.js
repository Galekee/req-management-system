import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Briefcase, TrendingUp, Award, ExternalLink, Trash2, Plus } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../AuthContext';

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={24} style={{ cursor: 'pointer', transition: 'color 0.1s' }}
          fill={(hovered || value) >= i ? '#f59e0b' : 'none'}
          color={(hovered || value) >= i ? '#f59e0b' : 'var(--text-3)'}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i)}
        />
      ))}
    </div>
  );
}

function StarRating({ rating, size = 14 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size}
          fill={i <= Math.round(rating) ? '#f59e0b' : 'none'}
          color={i <= Math.round(rating) ? '#f59e0b' : 'var(--text-3)'}
        />
      ))}
    </div>
  );
}

export default function FreelancerDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [freelancer, setFreelancer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ client_name: '', rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  // Portfolio
  const [portfolio, setPortfolio] = useState([]);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [portForm, setPortForm] = useState({ title: '', description: '', tech: '', url: '' });

  const load = () => axios.get(`/api/freelancers/${id}`).then(r => {
    setFreelancer(r.data);
    setPortfolio(r.data.portfolio || []);
  });

  useEffect(() => { load(); }, [id]);

  const submitReview = async e => {
    e.preventDefault();
    setSubmitting(true);
    await axios.post(`/api/freelancers/${id}/reviews`, form);
    setForm({ client_name: '', rating: 5, comment: '' });
    setShowForm(false);
    await load();
    setSubmitting(false);
  };

  const addPortfolio = async e => {
    e.preventDefault();
    setSubmitting(true);
    await axios.post(`/api/freelancers/${id}/portfolio`, portForm);
    setPortForm({ title: '', description: '', tech: '', url: '' });
    setShowPortfolioForm(false);
    await load();
    setSubmitting(false);
  };

  const deletePortfolio = async (pid) => {
    await axios.delete(`/api/portfolio/${pid}`);
    await load();
  };

  if (!freelancer) return <div className="loading">Загрузка...</div>;

  const skills = freelancer.skills ? freelancer.skills.split(',').filter(Boolean) : [];
  const avgRating = freelancer.avgRating || 0;
  const reviews = freelancer.reviews || [];
  const isOwn = String(freelancer.user_id) === String(user?.id);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link to="/freelancers" className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> Назад
        </Link>
        <span style={{ color: 'var(--text-3)', fontSize: 12 }}>/</span>
        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{freelancer.name}</span>
      </div>

      <div className="detail-layout">
        {/* Main */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Profile card */}
          <div className="card">
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{
                width: 72, height: 72, borderRadius: 18,
                background: freelancer.avatar_color || '#6366f1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 700, color: '#fff', flexShrink: 0
              }}>{freelancer.name[0]}</div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{freelancer.name}</h2>
                <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 10 }}>{freelancer.title}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <StarRating rating={avgRating} size={16} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{avgRating > 0 ? avgRating : '—'}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-3)' }}>({reviews.length} отзывов)</span>
                </div>
              </div>
            </div>
            {freelancer.bio && (
              <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 16 }}>{freelancer.bio}</p>
            )}
            {skills.length > 0 && (
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Технологии</p>
                <div className="skills-list">
                  {skills.map((s, i) => <span key={i} className="skill-tag">{s.trim()}</span>)}
                </div>
              </div>
            )}
          </div>

          {/* Portfolio */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p className="card-title" style={{ marginBottom: 0 }}>Портфолио ({portfolio.length})</p>
              {isOwn && (
                <button className="btn btn-secondary btn-sm" onClick={() => setShowPortfolioForm(o => !o)}>
                  <Plus size={13} /> Новая работа
                </button>
              )}
            </div>

            {showPortfolioForm && (
              <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <form onSubmit={addPortfolio}>
                  <div className="form-grid" style={{ gap: 12 }}>
                    <div className="form-group full">
                      <label className="form-label">Название работы *</label>
                      <input className="form-input" placeholder="E-commerce платформа" required
                        value={portForm.title} onChange={e => setPortForm({ ...portForm, title: e.target.value })} />
                    </div>
                    <div className="form-group full">
                      <label className="form-label">Описание</label>
                      <textarea className="form-textarea" placeholder="О работе..."
                        value={portForm.description} onChange={e => setPortForm({ ...portForm, description: e.target.value })} style={{ minHeight: 70 }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Технологии (через запятую)</label>
                      <input className="form-input" placeholder="React, Node.js, PostgreSQL"
                        value={portForm.tech} onChange={e => setPortForm({ ...portForm, tech: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ссылка (URL)</label>
                      <input className="form-input" placeholder="https://github.com/..."
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
              <div className="empty" style={{ padding: 30 }}>
                <div className="empty-icon">💼</div>
                <div>Нет портфолио</div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {portfolio.map(item => {
                const techs = item.tech ? item.tech.split(',').filter(Boolean) : [];
                return (
                  <div key={item.id} style={{
                    background: 'var(--surface2)', borderRadius: 10,
                    border: '1px solid var(--border)', padding: 16,
                    display: 'flex', flexDirection: 'column', gap: 10,
                    transition: 'border-color 0.15s',
                    position: 'relative',
                  }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    {isOwn && (
                      <button
                        onClick={() => deletePortfolio(item.id)}
                        style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 2 }}
                        title="Удалить"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', paddingRight: isOwn ? 20 : 0 }}>{item.title}</div>
                    {item.description && (
                      <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>{item.description}</p>
                    )}
                    {techs.length > 0 && (
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {techs.map((t, i) => (
                          <span key={i} className="skill-tag" style={{ fontSize: 10 }}>{t.trim()}</span>
                        ))}
                      </div>
                    )}
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ justifyContent: 'center', marginTop: 'auto', fontSize: 12 }}
                        onClick={e => e.stopPropagation()}
                      >
                        <ExternalLink size={12} /> Посмотреть
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p className="card-title" style={{ marginBottom: 0 }}>Отзывы ({reviews.length})</p>
              <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
                ⭐ Оставить отзыв
              </button>
            </div>

            {showForm && (
              <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div className="form-title" style={{ marginBottom: 12 }}>Оставить отзыв</div>
                <form onSubmit={submitReview}>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Ваше имя *</label>
                    <input className="form-input" placeholder="Иван Иванов" required
                      value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Рейтинг</label>
                    <StarPicker value={form.rating} onChange={v => setForm({ ...form, rating: v })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">Отзыв</label>
                    <textarea className="form-textarea" placeholder="Напишите ваш отзыв о работе..."
                      value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? 'Отправка...' : 'Отправить'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Отмена</button>
                  </div>
                </form>
              </div>
            )}

            {reviews.length === 0 && !showForm && (
              <div className="empty"><div className="empty-icon">⭐</div><div>Нет отзывов</div></div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviews.map(r => (
                <div key={r.id} style={{ padding: '14px 16px', background: 'var(--surface2)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                        {r.client_name[0]}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{r.client_name}</span>
                    </div>
                    <StarRating rating={r.rating} size={13} />
                  </div>
                  {r.comment && <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>{r.comment}</p>}
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
                    {new Date(r.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="detail-sidebar">
          <div className="card">
            <p className="card-title">Статистика</p>
            <div className="meta-list">
              <div className="meta-row">
                <span className="meta-key"><Award size={12} style={{ display: 'inline', marginRight: 4 }} />Рейтинг</span>
                <span className="meta-val" style={{ color: '#f59e0b', fontWeight: 700 }}>
                  {avgRating > 0 ? `★ ${avgRating}` : '—'}
                </span>
              </div>
              <div className="meta-row">
                <span className="meta-key"><Briefcase size={12} style={{ display: 'inline', marginRight: 4 }} />Проектов</span>
                <span className="meta-val" style={{ fontWeight: 700 }}>{freelancer.jobs_done}</span>
              </div>
              <div className="meta-row">
                <span className="meta-key"><TrendingUp size={12} style={{ display: 'inline', marginRight: 4 }} />Ставка в час</span>
                <span className="meta-val" style={{ color: 'var(--green)', fontWeight: 700 }}>{Number(freelancer.hourly_rate).toLocaleString()} ₸</span>
              </div>
              <div className="meta-row">
                <span className="meta-key"><MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />Местоположение</span>
                <span className="meta-val">{freelancer.location}</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">💰 Общий доход</span>
                <span className="meta-val" style={{ color: 'var(--green)', fontWeight: 700 }}>{Number(freelancer.total_earned).toLocaleString()} ₸</span>
              </div>
            </div>
          </div>

          <div className="card">
            <p className="card-title">Действия</p>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowForm(true)}>
              ⭐ Оставить отзыв
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
