import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const STATUS_LABELS = { new: 'Жаңа', in_progress: 'Орындалуда', approved: 'Бекітілген', rejected: 'Қабылданбаған', on_hold: 'Тоқтатылған' };
const TYPE_LABELS = { functional: 'Функционалды', non_functional: 'Функционалды емес' };
const PRIORITY_LABELS = { high: 'Жоғары', medium: 'Орташа', low: 'Төмен' };

export default function RequirementsList() {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', type: '', priority: '', status: '' });

  const fetchRequirements = () => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.type) params.type = filters.type;
    if (filters.priority) params.priority = filters.priority;
    if (filters.status) params.status = filters.status;

    axios.get('/api/requirements', { params })
      .then(r => { setRequirements(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchRequirements(); }, [filters]);

  const handleDelete = async (id) => {
    if (!window.confirm('Талапты жою керек пе?')) return;
    await axios.delete(`/api/requirements/${id}`);
    fetchRequirements();
  };

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Талаптар тізімі</h1>
          <p className="page-subtitle">{requirements.length} талап табылды</p>
        </div>
        <Link to="/requirements/new" className="btn btn-primary">+ Жаңа талап</Link>
      </div>

      <div className="filters-bar">
        <input
          className="search-input"
          placeholder="Іздеу..."
          value={filters.search}
          onChange={e => setFilter('search', e.target.value)}
        />
        <select className="filter-select" value={filters.type} onChange={e => setFilter('type', e.target.value)}>
          <option value="">Барлық түрлер</option>
          <option value="functional">Функционалды</option>
          <option value="non_functional">Функционалды емес</option>
        </select>
        <select className="filter-select" value={filters.priority} onChange={e => setFilter('priority', e.target.value)}>
          <option value="">Барлық басымдықтар</option>
          <option value="high">Жоғары</option>
          <option value="medium">Орташа</option>
          <option value="low">Төмен</option>
        </select>
        <select className="filter-select" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
          <option value="">Барлық статустар</option>
          <option value="new">Жаңа</option>
          <option value="in_progress">Орындалуда</option>
          <option value="approved">Бекітілген</option>
          <option value="rejected">Қабылданбаған</option>
          <option value="on_hold">Тоқтатылған</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Жүктелуде...</div>
      ) : requirements.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p>Талаптар табылмады</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Атауы</th>
                <th>Түрі</th>
                <th>Басымдық</th>
                <th>Статус</th>
                <th>Орындаушы</th>
                <th>Күні</th>
                <th>Әрекеттер</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map(req => (
                <tr key={req.id}>
                  <td style={{ color: '#64748b', fontSize: 12, fontFamily: 'monospace' }}>
                    {req.id.slice(0, 8)}
                  </td>
                  <td>
                    <Link to={`/requirements/${req.id}`} className="req-title-link">
                      {req.title}
                    </Link>
                    {req.category && (
                      <span style={{ marginLeft: 8, fontSize: 11, color: '#475569' }}>{req.category}</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${req.type}`}>
                      {TYPE_LABELS[req.type] || req.type}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${req.priority}`}>
                      {PRIORITY_LABELS[req.priority] || req.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${req.status}`}>
                      {STATUS_LABELS[req.status] || req.status}
                    </span>
                  </td>
                  <td style={{ color: '#94a3b8' }}>{req.assignee || '—'}</td>
                  <td style={{ color: '#64748b', fontSize: 12 }}>
                    {new Date(req.created_at).toLocaleDateString('kk-KZ')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link to={`/requirements/${req.id}/edit`} className="btn btn-secondary btn-sm">
                        Өзгерту
                      </Link>
                      <button onClick={() => handleDelete(req.id)} className="btn btn-danger btn-sm">
                        Жою
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
