import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, MapPin, Briefcase, TrendingUp } from 'lucide-react';
import axios from 'axios';

function StarRating({ rating, size = 14 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={size}
          fill={i <= Math.round(rating) ? '#f59e0b' : 'none'}
          color={i <= Math.round(rating) ? '#f59e0b' : 'var(--text-3)'}
        />
      ))}
    </div>
  );
}

export default function Freelancers() {
  const [freelancers, setFreelancers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/freelancers').then(r => {
      setFreelancers(r.data);
      setLoading(false);
    });
  }, []);

  const filtered = freelancers.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.title.toLowerCase().includes(search.toLowerCase()) ||
    f.skills.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading">Жүктелуде...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Фрилансерлер</h1>
          <p className="page-sub">{freelancers.length} маман тіркелген</p>
        </div>
      </div>

      <div style={{ marginBottom: 20, position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
        <input
          className="form-input"
          style={{ paddingLeft: 36 }}
          placeholder="Аты, мамандық немесе технология бойынша іздеу..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <div className="empty">
          <div className="empty-icon">👤</div>
          <div>Фрилансер табылмады</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {filtered.map(f => {
          const skills = f.skills ? f.skills.split(',').filter(Boolean) : [];
          return (
            <Link key={f.id} to={`/freelancers/${f.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(99,102,241,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: f.avatar_color || '#6366f1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0
                  }}>
                    {f.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-1)', marginBottom: 2 }}>{f.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>{f.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <StarRating rating={f.avgRating} />
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {f.avgRating > 0 ? f.avgRating : '—'} ({f.reviews?.length || 0} пікір)
                      </span>
                    </div>
                  </div>
                </div>

                {f.bio && (
                  <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 12,
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {f.bio}
                  </p>
                )}

                {skills.length > 0 && (
                  <div className="skills-list" style={{ marginBottom: 14 }}>
                    {skills.slice(0, 4).map((s, i) => (
                      <span key={i} className="skill-tag">{s.trim()}</span>
                    ))}
                    {skills.length > 4 && <span className="skill-tag" style={{ color: 'var(--text-3)' }}>+{skills.length - 4}</span>}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-3)' }}>
                    <MapPin size={12} />
                    {f.location}
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-2)' }}>
                      <Briefcase size={12} />
                      {f.jobs_done} жоба
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>
                      <TrendingUp size={12} />
                      {Number(f.hourly_rate).toLocaleString()} ₸/сағ
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
