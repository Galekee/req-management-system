import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import axios from 'axios';

const DEMO_ACCOUNTS = [
  { label: '🔑 Админ', email: 'admin@freelanzer.kz', password: 'admin123' },
  { label: '👤 Клиент', email: 'askar@mail.kz', password: 'client123' },
  { label: '💼 Фрилансер', email: 'bekarys@mail.kz', password: 'free123' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'client', title: '', skills: '', location: 'Алматы', hourly_rate: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email: form.email, password: form.password });
      login(res.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Произошла ошибка');
    }
    setLoading(false);
  };

  const handleRegister = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', form);
      login(res.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Произошла ошибка');
    }
    setLoading(false);
  };

  const fillDemo = (account) => {
    setForm(f => ({ ...f, email: account.email, password: account.password }));
    setTab('login');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 20
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 auto 12px'
          }}>F</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>Freelanzer</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>IT фриланс платформа · АЖ-49</p>
        </div>

        {/* Demo quick-login */}
        <div style={{ background: 'var(--bg-2)', borderRadius: 12, padding: 14, marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Demo аккаунты</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {DEMO_ACCOUNTS.map(acc => (
              <button key={acc.email} onClick={() => fillDemo(acc)}
                style={{
                  flex: 1, padding: '7px 4px', borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--bg-1)', color: 'var(--text-2)', fontSize: 12, cursor: 'pointer',
                  fontWeight: 500, transition: 'all 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
          {[{ key: 'login', label: 'Войти' }, { key: 'register', label: 'Регистрация' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, background: 'none', border: 'none', padding: '10px', fontSize: 14, fontWeight: 600,
              color: tab === t.key ? 'var(--accent)' : 'var(--text-3)',
              borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              cursor: 'pointer', marginBottom: -1
            }}>{t.label}</button>
          ))}
        </div>

        {error && (
          <div style={{ background: '#ef444420', border: '1px solid #ef444444', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#ef4444' }}>
            {error}
          </div>
        )}

        {tab === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="email@mail.kz" required
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Пароль</label>
              <input className="form-input" type="password" placeholder="••••••••" required
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        )}

        {tab === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-grid">
              <div className="form-group full" style={{ marginBottom: 12 }}>
                <label className="form-label">Имя *</label>
                <input className="form-input" placeholder="Иван Иванов" required
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group full" style={{ marginBottom: 12 }}>
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" placeholder="email@mail.kz" required
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-group full" style={{ marginBottom: 12 }}>
                <label className="form-label">Пароль *</label>
                <input className="form-input" type="password" placeholder="••••••••" required
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
              <div className="form-group full" style={{ marginBottom: 12 }}>
                <label className="form-label">Роль</label>
                <select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="client">Клиент (размещаю заказы)</option>
                  <option value="freelancer">Фрилансер (ищу работу)</option>
                </select>
              </div>
              {form.role === 'freelancer' && (
                <>
                  <div className="form-group full" style={{ marginBottom: 12 }}>
                    <label className="form-label">Специальность</label>
                    <input className="form-input" placeholder="Full-Stack Developer"
                      value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div className="form-group full" style={{ marginBottom: 12 }}>
                    <label className="form-label">Технологии (через запятую)</label>
                    <input className="form-input" placeholder="React, Node.js, Python"
                      value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Ставка в час (₸)</label>
                    <input className="form-input" type="number" placeholder="3000"
                      value={form.hourly_rate} onChange={e => setForm({ ...form, hourly_rate: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Город</label>
                    <input className="form-input" placeholder="Алматы"
                      value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                  </div>
                  <div style={{ gridColumn: '1/-1', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>
                    ℹ️ После регистрации в качестве фрилансера необходимо одобрение администратора. До одобрения вы не сможете искать работу на платформе.
                  </div>
                </>
              )}
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={loading}>
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
