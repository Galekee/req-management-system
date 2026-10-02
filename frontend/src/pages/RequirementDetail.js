import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const STATUS_LABELS = { new: 'Жаңа', in_progress: 'Орындалуда', approved: 'Бекітілген', rejected: 'Қабылданбаған', on_hold: 'Тоқтатылған' };
const TYPE_LABELS = { functional: 'Функционалды', non_functional: 'Функционалды емес' };
const PRIORITY_LABELS = { high: 'Жоғары', medium: 'Орташа', low: 'Төмен' };

export default function RequirementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [author, setAuthor] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchReq = () => {
    axios.get(`/api/requirements/${id}`)
      .then(r => { setReq(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchReq(); }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Талапты жою керек пе?')) return;
    await axios.delete(`/api/requirements/${id}`);
    navigate('/requirements');
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    await axios.post(`/api/requirements/${id}/comments`, {
      text: comment,
      author: author.trim() || 'Анонимді'
    });
    setComment('');
    setPosting(false);
    fetchReq();
  };

  if (loading) return <div className="loading">Жүктелуде...</div>;
  if (!req) return <div className="loading">Талап табылмады</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Link to="/requirements" style={{ color: '#64748b', textDecoration: 'none', fontSize: 14 }}>
              ← Тізімге оралу
            </Link>
          </div>
          <h1 className="page-title">{req.title}</h1>
          <p className="page-subtitle" style={{ fontFamily: 'monospace', fontSize: 12, marginTop: 4 }}>
            ID: {req.id}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to={`/requirements/${id}/edit`} className="btn btn-secondary">Өзгерту</Link>
          <button onClick={handleDelete} className="btn btn-danger">Жою</button>
        </div>
      </div>

      <div className="detail-grid">
        {/* Main info */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>Сипаттамасы</h2>
            {req.description ? (
              <p style={{ color: '#cbd5e1', lineHeight: 1.7, fontSize: 14 }}>{req.description}</p>
            ) : (
              <p style={{ color: '#475569', fontStyle: 'italic', fontSize: 14 }}>Сипаттама жоқ</p>
            )}
          </div>

          {/* Comments */}
          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>
              Пікірлер {req.comments?.length > 0 && <span style={{ color: '#64748b', fontWeight: 400 }}>({req.comments.length})</span>}
            </h2>

            {req.comments?.length === 0 && (
              <p style={{ color: '#475569', fontSize: 14, marginBottom: 16 }}>Пікірлер жоқ</p>
            )}

            {req.comments?.map(c => (
              <div key={c.id} className="comment">
                <div className="comment-author">{c.author}</div>
                <div className="comment-text">{c.text}</div>
                <div className="comment-date">{new Date(c.created_at).toLocaleString('kk-KZ')}</div>
              </div>
            ))}

            <form onSubmit={handleComment} style={{ marginTop: 16 }}>
              <div className="form-group" style={{ marginBottom: 10 }}>
                <input
                  className="form-input"
                  placeholder="Сіздің атыңыз"
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 10 }}>
                <textarea
                  className="form-textarea"
                  placeholder="Пікіріңізді жазыңыз..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={posting || !comment.trim()}>
                {posting ? 'Жіберілуде...' : 'Пікір қалдыру'}
              </button>
            </form>
          </div>
        </div>

        {/* Meta sidebar */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Мәліметтер</h2>

          <div className="meta-item">
            <span className="meta-label">Статус</span>
            <span className={`badge badge-${req.status}`} style={{ marginTop: 4 }}>
              {STATUS_LABELS[req.status] || req.status}
            </span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Түрі</span>
            <span className={`badge badge-${req.type}`} style={{ marginTop: 4 }}>
              {TYPE_LABELS[req.type] || req.type}
            </span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Басымдық</span>
            <span className={`badge badge-${req.priority}`} style={{ marginTop: 4 }}>
              {PRIORITY_LABELS[req.priority] || req.priority}
            </span>
          </div>

          {req.assignee && (
            <div className="meta-item">
              <span className="meta-label">Орындаушы</span>
              <span className="meta-value">{req.assignee}</span>
            </div>
          )}

          {req.category && (
            <div className="meta-item">
              <span className="meta-label">Санат</span>
              <span className="meta-value">{req.category}</span>
            </div>
          )}

          <div className="meta-item">
            <span className="meta-label">Жасалған күні</span>
            <span className="meta-value">{new Date(req.created_at).toLocaleDateString('kk-KZ')}</span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Жаңартылған күні</span>
            <span className="meta-value">{new Date(req.updated_at).toLocaleDateString('kk-KZ')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
