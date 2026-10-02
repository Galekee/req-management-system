const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

// GET /api/requirements — получить все требования (с фильтрацией)
router.get('/', (req, res) => {
  const { type, priority, status, assignee, search } = req.query;

  let query = 'SELECT * FROM requirements WHERE 1=1';
  const params = [];

  if (type) { query += ' AND type = ?'; params.push(type); }
  if (priority) { query += ' AND priority = ?'; params.push(priority); }
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (assignee) { query += ' AND assignee = ?'; params.push(assignee); }
  if (search) {
    query += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC';

  const requirements = db.prepare(query).all(...params);
  res.json(requirements);
});

// GET /api/requirements/stats — статистика для дашборда
router.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM requirements').get().count;
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM requirements GROUP BY status').all();
  const byType = db.prepare('SELECT type, COUNT(*) as count FROM requirements GROUP BY type').all();
  const byPriority = db.prepare('SELECT priority, COUNT(*) as count FROM requirements GROUP BY priority').all();
  const byAssignee = db.prepare('SELECT assignee, COUNT(*) as count FROM requirements WHERE assignee IS NOT NULL GROUP BY assignee').all();

  res.json({ total, byStatus, byType, byPriority, byAssignee });
});

// GET /api/requirements/:id — получить одно требование
router.get('/:id', (req, res) => {
  const req_ = db.prepare('SELECT * FROM requirements WHERE id = ?').get(req.params.id);
  if (!req_) return res.status(404).json({ error: 'Талап табылмады' });

  const comments = db.prepare('SELECT * FROM comments WHERE requirement_id = ? ORDER BY created_at ASC').all(req.params.id);
  res.json({ ...req_, comments });
});

// POST /api/requirements — создать требование
router.post('/', (req, res) => {
  const { title, description, type, priority, status, assignee, category } = req.body;

  if (!title) return res.status(400).json({ error: 'Атауы міндетті' });

  const now = new Date().toISOString();
  const id = 'req-' + uuidv4().slice(0, 8);

  db.prepare(`
    INSERT INTO requirements (id, title, description, type, priority, status, assignee, category, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, description || '', type || 'functional', priority || 'medium', status || 'new', assignee || null, category || null, now, now);

  const created = db.prepare('SELECT * FROM requirements WHERE id = ?').get(id);
  res.status(201).json(created);
});

// PUT /api/requirements/:id — обновить требование
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM requirements WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Талап табылмады' });

  const { title, description, type, priority, status, assignee, category } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE requirements SET
      title = ?, description = ?, type = ?, priority = ?,
      status = ?, assignee = ?, category = ?, updated_at = ?
    WHERE id = ?
  `).run(
    title || existing.title,
    description !== undefined ? description : existing.description,
    type || existing.type,
    priority || existing.priority,
    status || existing.status,
    assignee !== undefined ? assignee : existing.assignee,
    category !== undefined ? category : existing.category,
    now,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM requirements WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/requirements/:id — удалить требование
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM requirements WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Талап табылмады' });

  db.prepare('DELETE FROM requirements WHERE id = ?').run(req.params.id);
  res.json({ message: 'Талап жойылды' });
});

// POST /api/requirements/:id/comments — добавить комментарий
router.post('/:id/comments', (req, res) => {
  const { text, author } = req.body;
  if (!text || !author) return res.status(400).json({ error: 'Мәтін және автор міндетті' });

  const now = new Date().toISOString();
  const id = uuidv4();

  db.prepare('INSERT INTO comments (id, requirement_id, text, author, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.params.id, text, author, now);

  res.status(201).json({ id, requirement_id: req.params.id, text, author, created_at: now });
});

module.exports = router;
