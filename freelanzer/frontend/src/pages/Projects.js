import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Users } from 'lucide-react';
import axios from 'axios';

const CAT_LABELS = { web: 'Веб', mobile: 'Мобильді', design: 'Дизайн', bot: 'Бот', other: 'Басқа' };
const STATUS_LABELS = { open: 'Ашық', in_progress: 'Орындалуда', completed: 'Аяқталған', cancelled: 'Бас тартылған' };

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    axios.get('/api/projects').then(r => setProjects(r.data));
  }, []);

  const filtered = projects.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !cat || p.category === cat;
    const matchStatus = !status || p.status === status;
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Жобалар</h1>
          <p className="page-sub">{filtered.length} жоба табылды</p>
        </div>
        <Link to="/projects/new" className="btn btn-primary">+ Жоба жариялау</Link>
      </div>

      <div className="filters-bar">
        <input
          className="search-input"
          placeholder="🔍  Жоба іздеу..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={cat} onChange={e => setCat(e.target.value)}>
          <option value="">Барлық категория</option>
          <option value="web">Веб</option>
          <option value="mobile">Мобильді</option>
          <option value="design">Дизайн</option>
          <option value="bot">Бот</option>
          <option value="other">Басқа</option>
        </select>
        <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Барлық статус</option>
          <option value="open">Ашық</option>
          <option value="in_progress">Орындалуда</option>
          <option value="completed">Аяқталған</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📋</div>
          <div>Жоба табылмады</div>
        </div>
      ) : (
        <div className="projects-grid">
          {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project: p }) {
  const skills = p.skills ? p.skills.split(',').filter(Boolean) : [];

  return (
    <Link to={`/projects/${p.id}`} style={{ textDecoration: 'none' }}>
      <div className="project-card">
        <div className="project-card-header">
          <div>
            <div className="project-title">{p.title}</div>
            <div style={{ marginTop: 6 }}>
              <span className={`badge badge-${p.category}`}>{CAT_LABELS[p.category] || p.category}</span>
            </div>
          </div>
          <span className={`badge badge-${p.status}`}>{STATUS_LABELS[p.status] || p.status}</span>
        </div>

        <div className="project-desc">{p.description}</div>

        {skills.length > 0 && (
          <div className="skills-list">
            {skills.slice(0, 3).map((s, i) => <span key={i} className="skill-tag">{s.trim()}</span>)}
            {skills.length > 3 && <span className="skill-tag">+{skills.length - 3}</span>}
          </div>
        )}

        <div className="project-footer">
          <div>
            <div className="project-budget">
              {p.budget.toLocaleString()} ₸
              <span> / жоба</span>
            </div>
          </div>
          <div className="project-client">
            <div className="client-avatar">{p.client_name[0]}</div>
            {p.client_name}
          </div>
        </div>
      </div>
    </Link>
  );
}
