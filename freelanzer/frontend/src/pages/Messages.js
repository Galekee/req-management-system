import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../AuthContext';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Қазір';
  if (mins < 60) return `${mins} мин бұрын`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} сағ бұрын`;
  return d.toLocaleDateString('kk-KZ');
}

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await axios.get(`/api/messages?user_id=${user.id}`);
      setConversations(res.data || []);
    } catch {}
    setLoading(false);
  }, [user.id]);

  const loadThread = useCallback(async (conv) => {
    if (!conv) return;
    try {
      const res = await axios.get(
        `/api/messages?user_id=${user.id}&other_user_id=${conv.other_user_id}&project_id=${conv.project_id}`
      );
      setMessages(res.data || []);
    } catch {}
  }, [user.id]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!selected) return;
    loadThread(selected);
    pollRef.current = setInterval(() => {
      loadConversations();
      loadThread(selected);
    }, 5000);
    return () => clearInterval(pollRef.current);
  }, [selected, loadThread, loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async e => {
    e.preventDefault();
    if (!text.trim() || !selected) return;
    setSending(true);
    try {
      await axios.post('/api/messages', {
        from_user_id: user.id,
        to_user_id: selected.other_user_id,
        project_id: selected.project_id,
        content: text.trim(),
      });
      setText('');
      await loadThread(selected);
      await loadConversations();
    } catch {}
    setSending(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Хабарламалар</h1>
          <p className="page-sub">Жобалар бойынша хат алмасу</p>
        </div>
      </div>

      <div className="messages-layout">
        {/* Left: conversation list */}
        <div className="conv-list">
          {loading && (
            <div className="loading" style={{ padding: 40 }}>Жүктелуде...</div>
          )}
          {!loading && conversations.length === 0 && (
            <div className="empty" style={{ padding: 40 }}>
              <div className="empty-icon"><MessageSquare size={32} /></div>
              <div>Хабарлама жоқ</div>
            </div>
          )}
          {conversations.map(conv => {
            const isActive = selected?.other_user_id === conv.other_user_id && selected?.project_id === conv.project_id;
            return (
              <div
                key={`${conv.other_user_id}-${conv.project_id}`}
                className={`conv-item ${isActive ? 'active' : ''}`}
                onClick={() => setSelected(conv)}
              >
                <div className="conv-avatar">{(conv.other_user_name || '?')[0]}</div>
                <div className="conv-info">
                  <div className="conv-name">{conv.other_user_name}</div>
                  <div className="conv-project">{conv.project_title || `Жоба #${conv.project_id}`}</div>
                  <div className="conv-last">{conv.last_message}</div>
                </div>
                <div className="conv-meta">
                  <div className="conv-time">{timeAgo(conv.last_time)}</div>
                  {conv.unread_count > 0 && (
                    <span className="conv-unread">{conv.unread_count}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: chat thread */}
        <div className="chat-panel">
          {!selected ? (
            <div className="empty" style={{ height: '100%' }}>
              <div className="empty-icon"><MessageSquare size={40} /></div>
              <div>Сол жақтан сұхбат таңдаңыз</div>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <div className="conv-avatar" style={{ width: 34, height: 34, fontSize: 13 }}>
                  {(selected.other_user_name || '?')[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{selected.other_user_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{selected.project_title || `Жоба #${selected.project_id}`}</div>
                </div>
              </div>

              <div className="chat-messages">
                {messages.length === 0 && (
                  <div className="empty" style={{ marginTop: 40 }}>
                    <div>Хабарлама жіберіңіз</div>
                  </div>
                )}
                {messages.map(m => {
                  const isOwn = String(m.from_user_id) === String(user.id);
                  return (
                    <div key={m.id} className={`msg-row ${isOwn ? 'own' : 'other'}`}>
                      {!isOwn && (
                        <div className="msg-avatar">{(m.from_name || '?')[0]}</div>
                      )}
                      <div className="msg-bubble-wrap">
                        {!isOwn && <div className="msg-sender">{m.from_name}</div>}
                        <div className={`msg-bubble ${isOwn ? 'own' : ''}`}>{m.content}</div>
                        <div className="msg-time">{timeAgo(m.created_at)}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form className="chat-input-row" onSubmit={sendMessage}>
                <input
                  className="form-input chat-input"
                  placeholder="Хабарлама жазыңыз..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  disabled={sending}
                />
                <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()}>
                  <Send size={14} /> Жіберу
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
