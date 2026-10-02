import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';

export default function NewProject() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', category: 'web',
    budget: '', deadline: '', client_name: '', skills: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setSubmitting(true);
    const res = await axios.post('/api/projects', form);
    navigate(`/projects/${res.data.id}`);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link to="/projects" className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> Артқа
        </Link>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Жоба жариялау</h1>
          <p className="page-sub">Жаңа тапсырыс — фрилансерлер өтінім береді</p>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={submit}>
          <div className="form-grid">
            <div className="form-group full">
              <label className="form-label">Жоба атауы *</label>
              <input className="form-input" placeholder="Интернет-дүкен сайты" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>

            <div className="form-group full">
              <label className="form-label">Сипаттама *</label>
              <textarea className="form-textarea" style={{ minHeight: 120 }} placeholder="Жоба туралы толық ақпарат, не жасау керек, қандай функциялар болу тиіс..." required value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Категория</label>
              <select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="web">Веб-сайт</option>
                <option value="mobile">Мобильді қосымша</option>
                <option value="design">Дизайн</option>
                <option value="bot">Бот</option>
                <option value="other">Басқа</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Клиент аты *</label>
              <input className="form-input" placeholder="Асқар Беков" required value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Бюджет (₸) *</label>
              <input className="form-input" type="number" placeholder="150000" required value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Дедлайн</label>
              <input className="form-input" type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
            </div>

            <div className="form-group full">
              <label className="form-label">Технологиялар (үтірмен бөл)</label>
              <input className="form-input" placeholder="React, Node.js, PostgreSQL" value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Жариялануда...' : '🚀 Жариялау'}
            </button>
            <Link to="/projects" className="btn btn-secondary">Болдырмау</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
