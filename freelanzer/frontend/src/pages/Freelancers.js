import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, MapPin, Briefcase, TrendingUp, SlidersHorizontal, X } from 'lucide-react';
import axios from 'axios';
import useDebounce from '../hooks/useDebounce';
import { SkeletonCard } from '../components/Skeleton';

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

function StarFilter({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={18}
          style={{ cursor: 'pointer', transition: 'all 0.1s' }}
          fill={(hovered || value) >= i ? '#f59e0b' : 'none'}
          color={(hovered || value) >= i ? '#f59e0b' : 'var(--text-3)'}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(value === i ? 0 : i)}
        />
      ))}
    </div>
  );
}

export default function Freelancers() {
  const [freelancers, setFreelancers] = useState([]);
  const [search, setSearch] = useState('');
  const [minRate, setMinRate] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const debouncedSearch = useDebounce(search, 300);
  const debouncedMinRate = useDebounce(minRate, 400);
  const debouncedMaxRate = useDebounce(maxRate, 400);

  const fetchFreelancers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.append('search', debouncedSearch);
    if (debouncedMinRate) params.append('min_rate', debouncedMinRate);
    if (debouncedMaxRate) params.append('max_rate', debouncedMaxRate);
    if (minRating > 0) params.append('min_rating', minRating);

    axios.get(`/api/freelancers?${params.toString()}`).then(r => {
      setFreelancers(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [debouncedSearch, debouncedMinRate, debouncedMaxRate, minRating]);

  useEffect(() => { fetchFreelancers(); }, [fetchFreelancers]);

  const activeFilterCount = [
    debouncedMinRate,
    debouncedMaxRate,
    minRating > 0,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setMinRate('');
    setMaxRate('');
    setMinRating(0);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Фрилансерлер</h1>
          <p className="page-sub">{freelancers.length} маман тіркелген</p>
        </div>
      </div>

      {/* Search + filter button */}
      <div style={{ display: 'flex', gap: 8, marginBottom: filtersOpen ? 0 : 16 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 36, width: '100%' }}
            placeholder="Аты, мамандық немесе технология бойынша іздеу..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          className={`btn ${filtersOpen ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFiltersOpen(o => !o)}
          style={{ position: 'relative', flexShrink: 0 }}
        >
          <SlidersHorizontal size={14} /> Сүзгі
          {activeFilterCount > 0 && (
            <span style={{
              position: 'absolute', top: -6, right: -6,
              background: 'var(--red)', color: '#fff',
              borderRadius: 999, fontSize: 10, fontWeight: 700,
              padding: '1px 5px', minWidth: 16, textAlign: 'center',
            }}>{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* Collapsible filter panel */}
      {filtersOpen && (
        <div className="card" style={{ marginBottom: 16, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Сүзгілер</span>
            {activeFilterCount > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                <X size={12} /> Тазалау
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6, fontWeight: 500 }}>Мин. сағаттық баға (₸)</div>
              <input
                className="form-input"
                type="number"
                placeholder="0"
                value={minRate}
                onChange={e => setMinRate(e.target.value)}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6, fontWeight: 500 }}>Макс. сағаттық баға (₸)</div>
              <input
                className="form-input"
                type="number"
                placeholder="999999"
                value={maxRate}
                onChange={e => setMaxRate(e.target.value)}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8, fontWeight: 500 }}>Мин. рейтинг</div>
              <StarFilter value={minRating} onChange={setMinRating} />
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && freelancers.length === 0 && (
        <div className="empty">
          <div className="empty-icon">👤</div>
          <div>Фрилансер табылмады</div>
        </div>
      )}

      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {freelancers.map(f => {
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
                    }}>{f.name[0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', marginBottom: 2 }}>{f.name}</div>
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
                      {skills.slice(0, 4).map((s, i) => <span key={i} className="skill-tag">{s.trim()}</span>)}
                      {skills.length > 4 && <span className="skill-tag" style={{ color: 'var(--text-3)' }}>+{skills.length - 4}</span>}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-3)' }}>
                      <MapPin size={12} /> {f.location}
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-2)' }}>
                        <Briefcase size={12} /> {f.jobs_done} жоба
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>
                        <TrendingUp size={12} /> {Number(f.hourly_rate).toLocaleString()} ₸/сағ
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
