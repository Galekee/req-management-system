// Pure Node.js backend — no external dependencies needed
const http = require('node:http');
const { DatabaseSync } = require('node:sqlite');
const { randomUUID } = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');
const url = require('node:url');

const PORT = 5000;

// ── Database setup ──────────────────────────────────────────────────────────
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'requirements.db'));
db.exec('PRAGMA journal_mode = WAL;');
db.exec(`
  CREATE TABLE IF NOT EXISTS requirements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'functional',
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'new',
    assignee TEXT,
    category TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    requirement_id TEXT NOT NULL,
    text TEXT NOT NULL,
    author TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (requirement_id) REFERENCES requirements(id) ON DELETE CASCADE
  );
`);

// Seed data
const countRow = db.prepare('SELECT COUNT(*) as count FROM requirements').get();
if (countRow.count === 0) {
  const now = new Date().toISOString();
  const ins = db.prepare(`INSERT INTO requirements (id,title,description,type,priority,status,assignee,category,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  [
    ['req-001','Пайдаланушы аутентификациясы','Жүйе пайдаланушының логин мен парольді тексеруі тиіс','functional','high','approved','Бекарыс','Қауіпсіздік'],
    ['req-002','Талаптарды тізімдеу','Барлық талаптарды кесте түрінде көрсету','functional','high','in_progress','Бекарыс','UI'],
    ['req-003','Өнімділік талабы','Жүйе 200 бір мезгілдегі пайдаланушыны p95 < 800мс кезінде қолдауы тиіс','non_functional','high','new','Саят','Өнімділік'],
    ['req-004','Деректерді экспорттау','Талаптарды PDF және Excel форматында экспорттау','functional','medium','new','Саят','Интеграция'],
    ['req-005','Қауіпсіздік талабы','Барлық API сұраныстары JWT токенмен авторизацияланған болуы тиіс','non_functional','high','in_progress','Бекарыс','Қауіпсіздік'],
    ['req-006','Хабарлама жүйесі','Талаптың статусы өзгергенде email хабарлама жіберу','functional','low','rejected','Саят','Интеграция'],
    ['req-007','Сақтық көшірме','Деректер базасының күнделікті автоматты сақтық көшірмесі','non_functional','medium','approved','Саят','Инфрақұрылым'],
  ].forEach(s => ins.run(s[0],s[1],s[2],s[3],s[4],s[5],s[6],s[7],now,now));
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => data += c);
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function send(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

// ── Router ───────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const query = parsed.query;
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  try {
    // GET /api/requirements/stats
    if (method === 'GET' && pathname === '/api/requirements/stats') {
      const total = db.prepare('SELECT COUNT(*) as count FROM requirements').get().count;
      const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM requirements GROUP BY status').all();
      const byType = db.prepare('SELECT type, COUNT(*) as count FROM requirements GROUP BY type').all();
      const byPriority = db.prepare('SELECT priority, COUNT(*) as count FROM requirements GROUP BY priority').all();
      const byAssignee = db.prepare('SELECT assignee, COUNT(*) as count FROM requirements WHERE assignee IS NOT NULL GROUP BY assignee ORDER BY count DESC').all();
      return send(res, 200, { total, byStatus, byType, byPriority, byAssignee });
    }

    // GET /api/requirements
    if (method === 'GET' && pathname === '/api/requirements') {
      let q = 'SELECT * FROM requirements WHERE 1=1';
      const params = [];
      if (query.type)     { q += ' AND type = ?'; params.push(query.type); }
      if (query.priority) { q += ' AND priority = ?'; params.push(query.priority); }
      if (query.status)   { q += ' AND status = ?'; params.push(query.status); }
      if (query.assignee) { q += ' AND assignee = ?'; params.push(query.assignee); }
      if (query.search)   { q += ' AND (title LIKE ? OR description LIKE ?)'; params.push(`%${query.search}%`, `%${query.search}%`); }
      q += ' ORDER BY created_at DESC';
      return send(res, 200, db.prepare(q).all(...params));
    }

    // POST /api/requirements
    if (method === 'POST' && pathname === '/api/requirements') {
      const body = await readBody(req);
      if (!body.title) return send(res, 400, { error: 'Атауы міндетті' });
      const now = new Date().toISOString();
      const id = 'req-' + randomUUID().slice(0, 8);
      db.prepare(`INSERT INTO requirements (id,title,description,type,priority,status,assignee,category,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
        .run(id, body.title, body.description||'', body.type||'functional', body.priority||'medium', body.status||'new', body.assignee||null, body.category||null, now, now);
      return send(res, 201, db.prepare('SELECT * FROM requirements WHERE id = ?').get(id));
    }

    // Routes with :id
    const idMatch = pathname.match(/^\/api\/requirements\/([^/]+)$/);
    const commentMatch = pathname.match(/^\/api\/requirements\/([^/]+)\/comments$/);

    if (commentMatch) {
      const id = commentMatch[1];
      if (method === 'POST') {
        const body = await readBody(req);
        if (!body.text || !body.author) return send(res, 400, { error: 'Мәтін және автор міндетті' });
        const now = new Date().toISOString();
        const cid = randomUUID();
        db.prepare('INSERT INTO comments (id,requirement_id,text,author,created_at) VALUES (?,?,?,?,?)')
          .run(cid, id, body.text, body.author, now);
        return send(res, 201, { id: cid, requirement_id: id, text: body.text, author: body.author, created_at: now });
      }
    }

    if (idMatch) {
      const id = idMatch[1];

      if (method === 'GET') {
        const r = db.prepare('SELECT * FROM requirements WHERE id = ?').get(id);
        if (!r) return send(res, 404, { error: 'Талап табылмады' });
        const comments = db.prepare('SELECT * FROM comments WHERE requirement_id = ? ORDER BY created_at ASC').all(id);
        return send(res, 200, { ...r, comments });
      }

      if (method === 'PUT') {
        const existing = db.prepare('SELECT * FROM requirements WHERE id = ?').get(id);
        if (!existing) return send(res, 404, { error: 'Талап табылмады' });
        const body = await readBody(req);
        const now = new Date().toISOString();
        db.prepare(`UPDATE requirements SET title=?,description=?,type=?,priority=?,status=?,assignee=?,category=?,updated_at=? WHERE id=?`)
          .run(
            body.title||existing.title,
            body.description!==undefined ? body.description : existing.description,
            body.type||existing.type,
            body.priority||existing.priority,
            body.status||existing.status,
            body.assignee!==undefined ? body.assignee : existing.assignee,
            body.category!==undefined ? body.category : existing.category,
            now, id
          );
        return send(res, 200, db.prepare('SELECT * FROM requirements WHERE id = ?').get(id));
      }

      if (method === 'DELETE') {
        const existing = db.prepare('SELECT * FROM requirements WHERE id = ?').get(id);
        if (!existing) return send(res, 404, { error: 'Талап табылмады' });
        db.prepare('DELETE FROM comments WHERE requirement_id = ?').run(id);
        db.prepare('DELETE FROM requirements WHERE id = ?').run(id);
        return send(res, 200, { message: 'Талап жойылды' });
      }
    }

    send(res, 404, { error: 'Route not found' });
  } catch (err) {
    console.error(err);
    send(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`✅ Сервер іске қосылды: http://localhost:${PORT}`);
});
