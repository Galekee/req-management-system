import React, { useEffect, useState } from 'react';
import { Search, Star, MapPin, DollarSign, Clock, Send, User, Edit3, Check } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../AuthContext';

const STATUS_LABELS = { open: 'Ашық', in_progress: 'Орындалуда', completed: 'Аяқталған' };
const CAT_LABELS = { web: 'Веб', mobile: 'Мобильді', design: 'Дизайн', bot: 'Бот', other: 'Басқа' };
const PROPOSAL_STATUS_LABELS = { pending: 'Қарауда', accepted: '✅ Қабылданды', rejected: '❌ Қабылданбады' };

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('browse');
  const [projects, setProjects] = useState([]);
  const [myProposals, setMyProposals] = useState([]);
  const [profile, setProfile] = useState(null);
  const [search, setSearch] = useState('');
  const [applyForm, setApplyForm] = useState({ projectId: null, cover_letter: '', bid_amount: '', delivery_days: '' });
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
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

  if (loading) return <div className="loading">Жүктелуде...</div>;

  // Blocked freelancer
  if (!profile?.is_approved) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <h2 style={{ color: 'var(--text-1)', marginBottom: 8 }}>Тіркелуіңіз тексерілуде</h2>
          <p style={{ color: 'var(--text-3)', lineHeight: 1.6 }}>
            Админ сіздің профиліңізді тексеруде. Бекітілгеннен кейін жұмыс іздей аласыз.
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
          <h1 className="page-title">Фрилансер кабинеті</h1>
          <p className="page-sub">Сәлем, {user.name}! Жұмыс іздеңіз</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {[
          { key: 'browse', label: `Жұмыс іздеу (${projects.length})` },
          { key: 'proposals', label: `Менің өтінімдерім (${myProposals.length})` },
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
            <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Жоба атауы, технология бойынша іздеу..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {applyForm.projectId && (
            <div className="form-card" style={{ marginBottom: 16 }}>
              <div className="form-title">Өтінім жіберу</div>
              <form onSubmit={submitProposal}>
                <div className="form-grid">
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Ұсынылған баға (₸) *</label>
                    <input className="form-input" type="number" placeholder="100000" required
                      value={applyForm.bid_amount} onChange={e => setApplyForm({ ...applyForm, bid_amount: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Орындау мерзімі (күн) *</label>
                    <input className="form-input" type="number" placeholder="14" required
                      value={applyForm.delivery_days} onChange={e => setApplyForm({ ...applyForm, delivery_days: e.target.value })} />
                  </div>
                  <div className="form-group full" style={{ marginBottom: 12 }}>
                    <label className="form-label">Сүйемелдеу хаты *</label>
                    <textarea className="form-textarea" placeholder="Бұл жобаны неге орындай аласыз..." required
                      value={applyForm.cover_letter} onChange={e => setApplyForm({ ...applyForm, cover_letter: e.target.value })} />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    <Send size={13} /> {submitting ? 'Жіберілуде...' : 'Өтінім жіберу'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setApplyForm({ projectId: null, cover_letter: '', bid_amount: '', delivery_days: '' })}>Болдырмау</button>
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
                        <Check size={13} /> Өтінім жіберілді
                      </span>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => setApplyForm({ projectId: p.id, cover_letter: '', bid_amount: '', delivery_days: '' })}>
                        <Send size={12} /> Өтінім беру
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
            <div className="empty"><div className="empty-icon">📩</div><div>Өтінім жоқ</div></div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myProposals.map(p => (
              <div key={p.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>{p.project_title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                      {Number(p.bid_amount).toLocaleString()} ₸ · {p.delivery_days} күн
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

      {/* Profile */}
      {tab === 'profile' && profile && (
        <div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p className="card-title" style={{ marginBottom: 0 }}>Менің профилім</p>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditProfile(!editProfile)}>
                <Edit3 size={13} /> {editProfile ? 'Болдырмау' : 'Өзгерту'}
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
                      <span>💰 {Number(profile.hourly_rate).toLocaleString()} ₸/сағ</span>
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
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Аяқталған жоба</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>{Number(profile.total_earned).toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Жалпы табыс ₸</div>
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
                    <label className="form-label">Аты-жөні</label>
                    <input className="form-input" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Мамандық</label>
                    <input className="form-input" value={profileForm.title} onChange={e => setProfileForm({ ...profileForm, title: e.target.value })} />
                  </div>
                  <div className="form-group full" style={{ marginBottom: 12 }}>
                    <label className="form-label">Өзіңіз туралы</label>
                    <textarea className="form-textarea" value={profileForm.bio} onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })} />
                  </div>
                  <div className="form-group full" style={{ marginBottom: 12 }}>
                    <label className="form-label">Технологиялар (үтірмен)</label>
                    <input className="form-input" value={profileForm.skills} onChange={e => setProfileForm({ ...profileForm, skills: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Сағаттық баға (₸)</label>
                    <input className="form-input" type="number" value={profileForm.hourly_rate} onChange={e => setProfileForm({ ...profileForm, hourly_rate: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Қала</label>
                    <input className="form-input" value={profileForm.location} onChange={e => setProfileForm({ ...profileForm, location: e.target.value })} />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Сақталуда...' : 'Сақтау'}
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
