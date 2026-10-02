import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const INITIAL = {
  title: '', description: '', type: 'functional', priority: 'medium',
  status: 'new', assignee: '', category: ''
};

export default function RequirementForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      axios.get(`/api/requirements/${id}`)
        .then(r => {
          const { title, description, type, priority, status, assignee, category } = r.data;
          setForm({ title, description, type, priority, status, assignee: assignee || '', category: category || '' });
          setLoading(false);
        })
        .catch(() => { setError('Деректерді жүктеу қатесі'); setLoading(false); });
    }
  }, [id, isEdit]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Атауы міндетті'); return; }
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await axios.put(`/api/requirements/${id}`, form);
        navigate(`/requirements/${id}`);
      } else {
        const res = await axios.post('/api/requirements', form);
        navigate(`/requirements/${res.data.id}`);
      }
    } catch {
      setError('Сақтау кезінде қате шықты');
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Жүктелуде...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'Талапты өзгерту' : 'Жаңа талап қосу'}</h1>
          <p className="page-subtitle">{isEdit ? 'Талап мәліметтерін жаңартыңыз' : 'Жаңа талап енгізіңіз'}</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#fca5a5', fontSize: 14 }}>
              {error}
            </div>
          )}

          <div className="form-grid">
            <div className="form-group full-width">
              <label className="form-label">Атауы *</label>
              <input
                className="form-input"
                placeholder="Талаптың атауын енгізіңіз"
                value={form.title}
                onChange={e => set('title', e.target.value)}
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Сипаттамасы</label>
              <textarea
                className="form-textarea"
                placeholder="Талапты толық сипаттаңыз..."
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={4}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Түрі</label>
              <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="functional">Функционалды</option>
                <option value="non_functional">Функционалды емес</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Басымдық</label>
              <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="high">Жоғары</option>
                <option value="medium">Орташа</option>
                <option value="low">Төмен</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Статус</label>
              <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="new">Жаңа</option>
                <option value="in_progress">Орындалуда</option>
                <option value="approved">Бекітілген</option>
                <option value="rejected">Қабылданбаған</option>
                <option value="on_hold">Тоқтатылған</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Орындаушы</label>
              <input
                className="form-input"
                placeholder="Атын енгізіңіз"
                value={form.assignee}
                onChange={e => set('assignee', e.target.value)}
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Санат</label>
              <input
                className="form-input"
                placeholder="Мысалы: Аутентификация, Есеп беру, ..."
                value={form.category}
                onChange={e => set('category', e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Сақталуда...' : isEdit ? 'Сақтау' : 'Қосу'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
              Болдырмау
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
