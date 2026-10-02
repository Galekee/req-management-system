import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, Briefcase, FileText, Star, Info } from 'lucide-react';
import axios from 'axios';

const TYPE_ICONS = {
  proposal: <Briefcase size={16} />,
  project: <FileText size={16} />,
  review: <Star size={16} />,
  info: <Info size={16} />,
};

const TYPE_COLORS = {
  proposal: '#6366f1',
  project: '#10b981',
  review: '#f59e0b',
  info: '#64748b',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Қазір';
  if (mins < 60) return `${mins} мин бұрын`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} сағ бұрын`;
  const days = Math.floor(hours / 24);
  return `${days} күн бұрын`;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => axios.get('/api/notifications').then(r => {
    setNotifications(r.data);
    setLoading(false);
  });

  useEffect(() => { load(); }, []);

  const markAll = async () => {
    await axios.put('/api/notifications/read-all');
    load();
  };

  const markOne = async (id) => {
    await axios.put(`/api/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
  };

  if (loading) return <div className="loading">Жүктелуде...</div>;

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Хабарландырулар</h1>
          <p className="page-sub">
            {unread > 0 ? `${unread} оқылмаған хабарландыру` : 'Барлығы оқылды'}
          </p>
        </div>
        {unread > 0 && (
          <button className="btn btn-secondary" onClick={markAll}>
            <CheckCheck size={14} /> Барлығын оқылды деп белгілеу
          </button>
        )}
      </div>

      {notifications.length === 0 && (
        <div className="empty">
          <div className="empty-icon">🔔</div>
          <div>Хабарландыру жоқ</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {notifications.map(n => (
          <div
            key={n.id}
            onClick={() => !n.is_read && markOne(n.id)}
            style={{
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
              padding: '16px 18px',
              background: n.is_read ? 'var(--bg-1)' : 'var(--bg-2)',
              border: `1px solid ${n.is_read ? 'var(--border)' : 'rgba(99,102,241,0.25)'}`,
              borderRadius: 12,
              cursor: n.is_read ? 'default' : 'pointer',
              transition: 'all 0.15s',
              position: 'relative',
            }}
            onMouseEnter={e => { if (!n.is_read) e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; }}
            onMouseLeave={e => { if (!n.is_read) e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'; }}
          >
            {/* Unread dot */}
            {!n.is_read && (
              <div style={{
                position: 'absolute', top: 16, right: 16,
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--accent)'
              }} />
            )}

            {/* Icon */}
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: TYPE_COLORS[n.type] + '22',
              color: TYPE_COLORS[n.type],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {TYPE_ICONS[n.type] || TYPE_ICONS.info}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <span style={{
                  fontSize: 14, fontWeight: n.is_read ? 500 : 700,
                  color: n.is_read ? 'var(--text-2)' : 'var(--text-1)'
                }}>
                  {n.title}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 6 }}>{n.message}</p>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{timeAgo(n.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
