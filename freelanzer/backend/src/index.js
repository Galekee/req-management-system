const http = require('node:http');
const { randomUUID } = require('node:crypto');
const { parse } = require('node:url');
const db = require('./database');

const PORT = 5000;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, data, status = 200) {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function body(req) {
  return new Promise(resolve => {
    let data = '';
    req.on('data', c => data += c);
    req.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve({}); } });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { cors(res); res.writeHead(204); res.end(); return; }

  const { pathname } = parse(req.url, true);
  const parts = pathname.split('/').filter(Boolean);

  // ── AUTH ──────────────────────────────────────────────
  // POST /api/auth/login
  if (req.method === 'POST' && pathname === '/api/auth/login') {
    const b = await body(req);
    const user = db.prepare('SELECT * FROM users WHERE email=? AND password=?').get(b.email, b.password);
    if (!user) return json(res, { error: 'Қате email немесе пароль' }, 401);
    const { password: _, ...safeUser } = user;
    return json(res, safeUser);
  }

  // POST /api/auth/register
  if (req.method === 'POST' && pathname === '/api/auth/register') {
    const b = await body(req);
    const exists = db.prepare('SELECT id FROM users WHERE email=?').get(b.email);
    if (exists) return json(res, { error: 'Бұл email тіркелген' }, 400);
    const id = randomUUID();
    const role = b.role || 'client';
    const isApproved = role === 'client' ? 1 : 0; // freelancers need admin approval
    db.prepare('INSERT INTO users (id,email,password,role,name,is_approved) VALUES (?,?,?,?,?,?)')
      .run(id, b.email, b.password, role, b.name, isApproved);
    if (role === 'freelancer') {
      const fid = randomUUID();
      db.prepare('INSERT INTO freelancers (id,user_id,name,title,bio,skills,hourly_rate,location,avatar_color,is_approved) VALUES (?,?,?,?,?,?,?,?,?,?)')
        .run(fid, id, b.name, b.title || 'Фрилансер', b.bio || '', b.skills || '', b.hourly_rate || 0, b.location || 'Қазақстан', '#6366f1', 0);
      // notify admin
      db.prepare('INSERT INTO notifications (id,type,title,message,user_id) VALUES (?,?,?,?,?)')
        .run(randomUUID(), 'info', 'Жаңа тіркелу сұранысы', `${b.name} фрилансер ретінде тіркелгісі келеді`, 'u0');
    }
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(id);
    const { password: _, ...safeUser } = user;
    return json(res, safeUser, 201);
  }

  // ── ADMIN ─────────────────────────────────────────────
  // GET /api/admin/users
  if (req.method === 'GET' && pathname === '/api/admin/users') {
    return json(res, db.prepare('SELECT id,email,role,name,is_approved,created_at FROM users ORDER BY created_at DESC').all());
  }

  // PUT /api/admin/users/:id/approve
  if (req.method === 'PUT' && parts[1] === 'admin' && parts[2] === 'users' && parts[4] === 'approve') {
    db.prepare('UPDATE users SET is_approved=1 WHERE id=?').run(parts[3]);
    db.prepare('UPDATE freelancers SET is_approved=1 WHERE user_id=?').run(parts[3]);
    const user = db.prepare('SELECT name FROM users WHERE id=?').get(parts[3]);
    db.prepare('INSERT INTO notifications (id,type,title,message,user_id) VALUES (?,?,?,?,?)')
      .run(randomUUID(), 'info', 'Тіркелуіңіз бекітілді', 'Платформаға қош келдіңіз! Жұмыс табуға болады.', parts[3]);
    return json(res, { ok: true });
  }

  // PUT /api/admin/users/:id/reject
  if (req.method === 'PUT' && parts[1] === 'admin' && parts[2] === 'users' && parts[4] === 'reject') {
    db.prepare('UPDATE users SET is_approved=0 WHERE id=?').run(parts[3]);
    db.prepare('UPDATE freelancers SET is_approved=0 WHERE user_id=?').run(parts[3]);
    return json(res, { ok: true });
  }

  // DELETE /api/admin/users/:id
  if (req.method === 'DELETE' && parts[1] === 'admin' && parts[2] === 'users' && parts[3]) {
    db.prepare('DELETE FROM freelancers WHERE user_id=?').run(parts[3]);
    db.prepare('DELETE FROM users WHERE id=?').run(parts[3]);
    return json(res, { ok: true });
  }

  // ── STATS ─────────────────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/stats') {
    const totalProjects = db.prepare('SELECT COUNT(*) as c FROM projects').get().c;
    const openProjects = db.prepare("SELECT COUNT(*) as c FROM projects WHERE status='open'").get().c;
    const totalProposals = db.prepare('SELECT COUNT(*) as c FROM proposals').get().c;
    const totalRequirements = db.prepare('SELECT COUNT(*) as c FROM requirements').get().c;
    const byCategory = db.prepare('SELECT category, COUNT(*) as count FROM projects GROUP BY category').all();
    const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM projects GROUP BY status').all();
    const topFreelancers = db.prepare('SELECT freelancer_name, COUNT(*) as count FROM proposals GROUP BY freelancer_name ORDER BY count DESC LIMIT 5').all();
    const unreadCount = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE is_read=0').get().c;
    const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    const pendingApprovals = db.prepare("SELECT COUNT(*) as c FROM users WHERE is_approved=0 AND role='freelancer'").get().c;
    return json(res, { totalProjects, openProjects, totalProposals, totalRequirements, byCategory, byStatus, topFreelancers, unreadCount, totalUsers, pendingApprovals });
  }

  // ── PROJECTS ──────────────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/projects') {
    const { client_id, status } = parse(req.url, true).query;
    let q = 'SELECT * FROM projects';
    const params = [];
    const conds = [];
    if (client_id) { conds.push('client_id=?'); params.push(client_id); }
    if (status) { conds.push('status=?'); params.push(status); }
    if (conds.length) q += ' WHERE ' + conds.join(' AND ');
    q += ' ORDER BY created_at DESC';
    return json(res, db.prepare(q).all(...params));
  }

  if (req.method === 'POST' && pathname === '/api/projects') {
    const b = await body(req);
    const id = randomUUID();
    db.prepare('INSERT INTO projects (id,title,description,category,budget,deadline,client_name,client_id,skills) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(id, b.title, b.description, b.category || 'web', b.budget || 0, b.deadline || '', b.client_name || 'Клиент', b.client_id || null, b.skills || '');
    db.prepare('INSERT INTO notifications (id,type,title,message) VALUES (?,?,?,?)')
      .run(randomUUID(), 'project', 'Жаңа жоба жарияланды', `"${b.title}" жобасы платформада жарияланды`);
    return json(res, db.prepare('SELECT * FROM projects WHERE id=?').get(id), 201);
  }

  if (req.method === 'GET' && parts[1] === 'projects' && parts[2] && !parts[3]) {
    const project = db.prepare('SELECT * FROM projects WHERE id=?').get(parts[2]);
    if (!project) return json(res, { error: 'Not found' }, 404);
    const proposals = db.prepare('SELECT * FROM proposals WHERE project_id=? ORDER BY created_at DESC').all(parts[2]);
    const requirements = db.prepare('SELECT * FROM requirements WHERE project_id=? ORDER BY created_at DESC').all(parts[2]);
    return json(res, { ...project, proposals, requirements });
  }

  if (req.method === 'PUT' && parts[1] === 'projects' && parts[2] && !parts[3]) {
    const b = await body(req);
    db.prepare('UPDATE projects SET title=?,description=?,category=?,budget=?,deadline=?,status=?,client_name=?,skills=? WHERE id=?')
      .run(b.title, b.description, b.category, b.budget, b.deadline, b.status, b.client_name, b.skills, parts[2]);
    return json(res, db.prepare('SELECT * FROM projects WHERE id=?').get(parts[2]));
  }

  if (req.method === 'DELETE' && parts[1] === 'projects' && parts[2]) {
    db.prepare('DELETE FROM proposals WHERE project_id=?').run(parts[2]);
    db.prepare('DELETE FROM requirements WHERE project_id=?').run(parts[2]);
    db.prepare('DELETE FROM projects WHERE id=?').run(parts[2]);
    return json(res, { ok: true });
  }

  // ── PROPOSALS ─────────────────────────────────────────
  if (req.method === 'POST' && parts[1] === 'projects' && parts[3] === 'proposals') {
    const b = await body(req);
    const id = randomUUID();
    db.prepare('INSERT INTO proposals (id,project_id,freelancer_name,freelancer_id,cover_letter,bid_amount,delivery_days) VALUES (?,?,?,?,?,?,?)')
      .run(id, parts[2], b.freelancer_name, b.freelancer_id || null, b.cover_letter, b.bid_amount || 0, b.delivery_days || 7);
    const proj = db.prepare('SELECT title, client_id FROM projects WHERE id=?').get(parts[2]);
    db.prepare('INSERT INTO notifications (id,type,title,message,user_id) VALUES (?,?,?,?,?)')
      .run(randomUUID(), 'proposal', 'Жаңа өтінім келді', `"${proj?.title || 'Жоба'}" жобасына ${b.freelancer_name} өтінім берді`, proj?.client_id || null);
    return json(res, db.prepare('SELECT * FROM proposals WHERE id=?').get(id), 201);
  }

  // PUT /api/proposals/:id/status  (client accept/reject)
  if (req.method === 'PUT' && parts[1] === 'proposals' && parts[2] && parts[3] === 'status') {
    const b = await body(req);
    db.prepare('UPDATE proposals SET status=? WHERE id=?').run(b.status, parts[2]);
    const proposal = db.prepare('SELECT * FROM proposals WHERE id=?').get(parts[2]);
    if (proposal && b.status === 'accepted') {
      // notify freelancer
      const fl = db.prepare('SELECT user_id FROM freelancers WHERE name=?').get(proposal.freelancer_name);
      const proj = db.prepare('SELECT title FROM projects WHERE id=?').get(proposal.project_id);
      if (fl) {
        db.prepare('INSERT INTO notifications (id,type,title,message,user_id) VALUES (?,?,?,?,?)')
          .run(randomUUID(), 'project', 'Өтініміңіз қабылданды!', `"${proj?.title}" жобасына өтініміңіз қабылданды`, fl.user_id);
      }
    }
    return json(res, db.prepare('SELECT * FROM proposals WHERE id=?').get(parts[2]));
  }

  // ── REQUIREMENTS ──────────────────────────────────────
  if (req.method === 'POST' && parts[1] === 'projects' && parts[3] === 'requirements') {
    const b = await body(req);
    const id = randomUUID();
    db.prepare('INSERT INTO requirements (id,project_id,title,description,type,priority,status) VALUES (?,?,?,?,?,?,?)')
      .run(id, parts[2], b.title, b.description || '', b.type || 'functional', b.priority || 'medium', b.status || 'new');
    return json(res, db.prepare('SELECT * FROM requirements WHERE id=?').get(id), 201);
  }

  if (req.method === 'PUT' && parts[1] === 'requirements' && parts[2]) {
    const b = await body(req);
    db.prepare('UPDATE requirements SET title=?,description=?,type=?,priority=?,status=? WHERE id=?')
      .run(b.title, b.description, b.type, b.priority, b.status, parts[2]);
    return json(res, db.prepare('SELECT * FROM requirements WHERE id=?').get(parts[2]));
  }

  // ── FREELANCERS ───────────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/freelancers') {
    const { approved } = parse(req.url, true).query;
    let q = 'SELECT * FROM freelancers';
    if (approved !== undefined) q += ` WHERE is_approved=${approved === '1' ? 1 : 0}`;
    q += ' ORDER BY jobs_done DESC';
    const freelancers = db.prepare(q).all();
    const result = freelancers.map(f => {
      const reviews = db.prepare('SELECT * FROM reviews WHERE freelancer_id=? ORDER BY created_at DESC').all(f.id);
      const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;
      return { ...f, reviews, avgRating: Number(avgRating) };
    });
    return json(res, result);
  }

  if (req.method === 'GET' && parts[1] === 'freelancers' && parts[2] && !parts[3]) {
    const f = db.prepare('SELECT * FROM freelancers WHERE id=?').get(parts[2]);
    if (!f) return json(res, { error: 'Not found' }, 404);
    const reviews = db.prepare('SELECT * FROM reviews WHERE freelancer_id=? ORDER BY created_at DESC').all(parts[2]);
    const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;
    return json(res, { ...f, reviews, avgRating: Number(avgRating) });
  }

  // GET /api/freelancers/by-user/:userId
  if (req.method === 'GET' && parts[1] === 'freelancers' && parts[2] === 'by-user' && parts[3]) {
    const f = db.prepare('SELECT * FROM freelancers WHERE user_id=?').get(parts[3]);
    if (!f) return json(res, { error: 'Not found' }, 404);
    const reviews = db.prepare('SELECT * FROM reviews WHERE freelancer_id=? ORDER BY created_at DESC').all(f.id);
    const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;
    return json(res, { ...f, reviews, avgRating: Number(avgRating) });
  }

  // PUT /api/freelancers/:id  (update profile)
  if (req.method === 'PUT' && parts[1] === 'freelancers' && parts[2] && !parts[3]) {
    const b = await body(req);
    db.prepare('UPDATE freelancers SET name=?,title=?,bio=?,skills=?,hourly_rate=?,location=? WHERE id=?')
      .run(b.name, b.title, b.bio, b.skills, b.hourly_rate, b.location, parts[2]);
    return json(res, db.prepare('SELECT * FROM freelancers WHERE id=?').get(parts[2]));
  }

  // GET /api/freelancers/:id/proposals  (freelancer's own proposals)
  if (req.method === 'GET' && parts[1] === 'freelancers' && parts[2] && parts[3] === 'proposals') {
    const proposals = db.prepare('SELECT p.*, pr.title as project_title, pr.budget as project_budget FROM proposals p JOIN projects pr ON p.project_id=pr.id WHERE p.freelancer_id=? ORDER BY p.created_at DESC').all(parts[2]);
    return json(res, proposals);
  }

  if (req.method === 'POST' && parts[1] === 'freelancers' && parts[3] === 'reviews') {
    const b = await body(req);
    const id = randomUUID();
    db.prepare('INSERT INTO reviews (id,freelancer_id,client_name,rating,comment) VALUES (?,?,?,?,?)')
      .run(id, parts[2], b.client_name, b.rating || 5, b.comment || '');
    const f = db.prepare('SELECT name FROM freelancers WHERE id=?').get(parts[2]);
    db.prepare('INSERT INTO notifications (id,type,title,message) VALUES (?,?,?,?)')
      .run(randomUUID(), 'review', 'Жаңа пікір қалдырылды', `${b.client_name} ${f?.name || 'фрилансерге'} ${b.rating} жұлдыз берді`);
    return json(res, db.prepare('SELECT * FROM reviews WHERE id=?').get(id), 201);
  }

  // ── NOTIFICATIONS ─────────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/notifications') {
    const { user_id } = parse(req.url, true).query;
    if (user_id) {
      return json(res, db.prepare('SELECT * FROM notifications WHERE user_id=? OR user_id IS NULL ORDER BY created_at DESC').all(user_id));
    }
    return json(res, db.prepare('SELECT * FROM notifications ORDER BY created_at DESC').all());
  }

  if (req.method === 'PUT' && pathname === '/api/notifications/read-all') {
    db.prepare('UPDATE notifications SET is_read=1').run();
    return json(res, { ok: true });
  }

  if (req.method === 'PUT' && parts[1] === 'notifications' && parts[3] === 'read') {
    db.prepare('UPDATE notifications SET is_read=1 WHERE id=?').run(parts[2]);
    return json(res, { ok: true });
  }

  json(res, { error: 'Not found' }, 404);
});

server.listen(PORT, () => console.log(`✅ Freelanzer backend: http://localhost:${PORT}`));
