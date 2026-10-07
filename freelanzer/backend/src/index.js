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

  const { pathname, query: qs } = parse(req.url, true);
  const parts = pathname.split('/').filter(Boolean);

  // ── AUTH ──────────────────────────────────────────────
  if (req.method === 'POST' && pathname === '/api/auth/login') {
    const b = await body(req);
    const user = db.prepare('SELECT * FROM users WHERE email=? AND password=?').get(b.email, b.password);
    if (!user) return json(res, { error: 'Қате email немесе пароль' }, 401);
    const { password: _, ...safeUser } = user;
    return json(res, safeUser);
  }

  if (req.method === 'POST' && pathname === '/api/auth/register') {
    const b = await body(req);
    const exists = db.prepare('SELECT id FROM users WHERE email=?').get(b.email);
    if (exists) return json(res, { error: 'Бұл email тіркелген' }, 400);
    const id = randomUUID();
    const role = b.role || 'client';
    const isApproved = role === 'client' ? 1 : 0;
    db.prepare('INSERT INTO users (id,email,password,role,name,is_approved) VALUES (?,?,?,?,?,?)')
      .run(id, b.email, b.password, role, b.name, isApproved);
    if (role === 'freelancer') {
      const fid = randomUUID();
      db.prepare('INSERT INTO freelancers (id,user_id,name,title,bio,skills,hourly_rate,location,avatar_color,avatar,is_approved) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
        .run(fid, id, b.name, b.title || 'Фрилансер', b.bio || '', b.skills || '', b.hourly_rate || 0, b.location || 'Қазақстан', '#6366f1', b.avatar || '', 0);
      db.prepare('INSERT INTO notifications (id,type,title,message,user_id) VALUES (?,?,?,?,?)')
        .run(randomUUID(), 'info', 'Жаңа тіркелу сұранысы', `${b.name} фрилансер ретінде тіркелгісі келеді`, 'u0');
    }
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(id);
    const { password: _, ...safeUser } = user;
    return json(res, safeUser, 201);
  }

  // ── ADMIN ─────────────────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/admin/users') {
    return json(res, db.prepare('SELECT id,email,role,name,is_approved,created_at FROM users ORDER BY created_at DESC').all());
  }

  if (req.method === 'PUT' && parts[1] === 'admin' && parts[2] === 'users' && parts[4] === 'approve') {
    db.prepare('UPDATE users SET is_approved=1 WHERE id=?').run(parts[3]);
    db.prepare('UPDATE freelancers SET is_approved=1 WHERE user_id=?').run(parts[3]);
    db.prepare('INSERT INTO notifications (id,type,title,message,user_id) VALUES (?,?,?,?,?)')
      .run(randomUUID(), 'info', 'Тіркелуіңіз бекітілді', 'Платформаға қош келдіңіз! Жұмыс табуға болады.', parts[3]);
    return json(res, { ok: true });
  }

  if (req.method === 'PUT' && parts[1] === 'admin' && parts[2] === 'users' && parts[4] === 'reject') {
    db.prepare('UPDATE users SET is_approved=0 WHERE id=?').run(parts[3]);
    db.prepare('UPDATE freelancers SET is_approved=0 WHERE user_id=?').run(parts[3]);
    return json(res, { ok: true });
  }

  if (req.method === 'DELETE' && parts[1] === 'admin' && parts[2] === 'users' && parts[3]) {
    db.prepare('DELETE FROM freelancers WHERE user_id=?').run(parts[3]);
    db.prepare('DELETE FROM users WHERE id=?').run(parts[3]);
    return json(res, { ok: true });
  }

  // ── STATS ─────────────────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/stats') {
    const { user_id } = qs;
    const totalProjects     = db.prepare('SELECT COUNT(*) as c FROM projects').get().c;
    const openProjects      = db.prepare("SELECT COUNT(*) as c FROM projects WHERE status='open'").get().c;
    const totalProposals    = db.prepare('SELECT COUNT(*) as c FROM proposals').get().c;
    const totalRequirements = db.prepare('SELECT COUNT(*) as c FROM requirements').get().c;
    const byCategory        = db.prepare('SELECT category, COUNT(*) as count FROM projects GROUP BY category').all();
    const byStatus          = db.prepare('SELECT status, COUNT(*) as count FROM projects GROUP BY status').all();
    const topFreelancers    = db.prepare('SELECT freelancer_name, COUNT(*) as count FROM proposals GROUP BY freelancer_name ORDER BY count DESC LIMIT 5').all();
    const totalUsers        = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    const pendingApprovals  = db.prepare("SELECT COUNT(*) as c FROM users WHERE is_approved=0 AND role='freelancer'").get().c;

    // unread count: user-specific or global
    let unreadCount;
    if (user_id) {
      unreadCount = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE is_read=0 AND (user_id=? OR user_id IS NULL)').get(user_id).c;
    } else {
      unreadCount = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE is_read=0').get().c;
    }

    // unread messages for user
    const unreadMessages = user_id
      ? db.prepare('SELECT COUNT(*) as c FROM messages WHERE to_user_id=? AND is_read=0').get(user_id).c
      : 0;

    // monthly projects (last 6 months) for chart
    const monthlyProjects = db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
      FROM projects GROUP BY month ORDER BY month DESC LIMIT 6
    `).all().reverse();

    // freelancer earnings (for freelancer dashboard)
    let myEarnings = null;
    if (user_id) {
      myEarnings = db.prepare(`
        SELECT strftime('%Y-%m', p.created_at) as month,
               COALESCE(SUM(pr.bid_amount),0) as earned
        FROM proposals pr
        JOIN projects p ON pr.project_id=p.id
        WHERE pr.freelancer_id=? AND pr.status='accepted'
        GROUP BY month ORDER BY month DESC LIMIT 6
      `).all(user_id).reverse();
    }

    return json(res, { totalProjects, openProjects, totalProposals, totalRequirements, byCategory, byStatus, topFreelancers, unreadCount, unreadMessages, totalUsers, pendingApprovals, monthlyProjects, myEarnings });
  }

  // ── PROJECTS ──────────────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/projects') {
    const { client_id, status, category, search } = qs;
    let q = 'SELECT * FROM projects';
    const params = [];
    const conds = [];
    if (client_id) { conds.push('client_id=?'); params.push(client_id); }
    if (status)    { conds.push('status=?');    params.push(status); }
    if (category)  { conds.push('category=?');  params.push(category); }
    if (search)    { conds.push('(title LIKE ? OR description LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
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
    const proposals    = db.prepare('SELECT * FROM proposals WHERE project_id=? ORDER BY created_at DESC').all(parts[2]);
    const requirements = db.prepare('SELECT * FROM requirements WHERE project_id=? ORDER BY created_at DESC').all(parts[2]);
    const milestones   = db.prepare('SELECT * FROM milestones WHERE project_id=? ORDER BY created_at ASC').all(parts[2]);
    return json(res, { ...project, proposals, requirements, milestones });
  }

  if (req.method === 'PUT' && parts[1] === 'projects' && parts[2] && !parts[3]) {
    const b = await body(req);
    db.prepare('UPDATE projects SET title=?,description=?,category=?,budget=?,deadline=?,status=?,progress=?,client_name=?,skills=? WHERE id=?')
      .run(b.title, b.description, b.category, b.budget, b.deadline, b.status, b.progress ?? 0, b.client_name, b.skills, parts[2]);
    return json(res, db.prepare('SELECT * FROM projects WHERE id=?').get(parts[2]));
  }

  if (req.method === 'DELETE' && parts[1] === 'projects' && parts[2]) {
    db.prepare('DELETE FROM proposals WHERE project_id=?').run(parts[2]);
    db.prepare('DELETE FROM requirements WHERE project_id=?').run(parts[2]);
    db.prepare('DELETE FROM milestones WHERE project_id=?').run(parts[2]);
    db.prepare('DELETE FROM projects WHERE id=?').run(parts[2]);
    return json(res, { ok: true });
  }

  // ── MILESTONES ────────────────────────────────────────
  // POST /api/projects/:id/milestones
  if (req.method === 'POST' && parts[1] === 'projects' && parts[3] === 'milestones') {
    const b = await body(req);
    const id = randomUUID();
    db.prepare('INSERT INTO milestones (id,project_id,title,is_done) VALUES (?,?,?,?)')
      .run(id, parts[2], b.title, b.is_done ? 1 : 0);
    return json(res, db.prepare('SELECT * FROM milestones WHERE id=?').get(id), 201);
  }

  // PUT /api/milestones/:id
  if (req.method === 'PUT' && parts[1] === 'milestones' && parts[2]) {
    const b = await body(req);
    db.prepare('UPDATE milestones SET is_done=? WHERE id=?').run(b.is_done ? 1 : 0, parts[2]);
    // auto-update project progress
    const ms = db.prepare('SELECT * FROM milestones WHERE id=?').get(parts[2]);
    if (ms) {
      const all = db.prepare('SELECT COUNT(*) as c FROM milestones WHERE project_id=?').get(ms.project_id).c;
      const done = db.prepare('SELECT COUNT(*) as c FROM milestones WHERE project_id=? AND is_done=1').get(ms.project_id).c;
      const progress = all > 0 ? Math.round((done / all) * 100) : 0;
      db.prepare('UPDATE projects SET progress=? WHERE id=?').run(progress, ms.project_id);
    }
    return json(res, { ok: true });
  }

  // DELETE /api/milestones/:id
  if (req.method === 'DELETE' && parts[1] === 'milestones' && parts[2]) {
    db.prepare('DELETE FROM milestones WHERE id=?').run(parts[2]);
    return json(res, { ok: true });
  }

  // ── PROPOSALS ─────────────────────────────────────────
  if (req.method === 'POST' && parts[1] === 'projects' && parts[3] === 'proposals') {
    const b = await body(req);
    const id = randomUUID();
    db.prepare('INSERT INTO proposals (id,project_id,freelancer_name,freelancer_id,cover_letter,bid_amount,delivery_days) VALUES (?,?,?,?,?,?,?)')
      .run(id, parts[2], b.freelancer_name, b.freelancer_id || null, b.cover_letter, b.bid_amount || 0, b.delivery_days || 7);
    const proj = db.prepare('SELECT title, client_id FROM projects WHERE id=?').get(parts[2]);
    db.prepare('INSERT INTO notifications (id,type,title,message,user_id,project_id) VALUES (?,?,?,?,?,?)')
      .run(randomUUID(), 'proposal', 'Жаңа өтінім келді', `"${proj?.title || 'Жоба'}" жобасына ${b.freelancer_name} өтінім берді`, proj?.client_id || null, parts[2]);
    return json(res, db.prepare('SELECT * FROM proposals WHERE id=?').get(id), 201);
  }

  if (req.method === 'PUT' && parts[1] === 'proposals' && parts[2] && parts[3] === 'status') {
    const b = await body(req);
    db.prepare('UPDATE proposals SET status=? WHERE id=?').run(b.status, parts[2]);
    const proposal = db.prepare('SELECT * FROM proposals WHERE id=?').get(parts[2]);
    if (proposal && b.status === 'accepted') {
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
    const { approved, min_rate, max_rate, min_rating, search } = qs;
    let q = 'SELECT * FROM freelancers WHERE 1=1';
    const params = [];
    if (approved !== undefined) { q += ` AND is_approved=${approved === '1' ? 1 : 0}`; }
    if (min_rate)  { q += ' AND hourly_rate >= ?'; params.push(Number(min_rate)); }
    if (max_rate)  { q += ' AND hourly_rate <= ?'; params.push(Number(max_rate)); }
    if (search)    { q += ' AND (name LIKE ? OR title LIKE ? OR skills LIKE ?)'; params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
    q += ' ORDER BY jobs_done DESC';
    const freelancers = db.prepare(q).all(...params);
    const result = freelancers.map(f => {
      const reviews = db.prepare('SELECT * FROM reviews WHERE freelancer_id=? ORDER BY created_at DESC').all(f.id);
      const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;
      if (min_rating && Number(avgRating) < Number(min_rating)) return null;
      return { ...f, reviews, avgRating: Number(avgRating) };
    }).filter(Boolean);
    return json(res, result);
  }

  if (req.method === 'GET' && parts[1] === 'freelancers' && parts[2] === 'by-user' && parts[3]) {
    const f = db.prepare('SELECT * FROM freelancers WHERE user_id=?').get(parts[3]);
    if (!f) return json(res, { error: 'Not found' }, 404);
    const reviews = db.prepare('SELECT * FROM reviews WHERE freelancer_id=? ORDER BY created_at DESC').all(f.id);
    const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;
    const portfolio = db.prepare('SELECT * FROM portfolio WHERE freelancer_id=? ORDER BY created_at DESC').all(f.id);
    return json(res, { ...f, reviews, avgRating: Number(avgRating), portfolio });
  }

  if (req.method === 'GET' && parts[1] === 'freelancers' && parts[2] && !parts[3]) {
    const f = db.prepare('SELECT * FROM freelancers WHERE id=?').get(parts[2]);
    if (!f) return json(res, { error: 'Not found' }, 404);
    const reviews = db.prepare('SELECT * FROM reviews WHERE freelancer_id=? ORDER BY created_at DESC').all(parts[2]);
    const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;
    const portfolio = db.prepare('SELECT * FROM portfolio WHERE freelancer_id=? ORDER BY created_at DESC').all(parts[2]);
    return json(res, { ...f, reviews, avgRating: Number(avgRating), portfolio });
  }

  if (req.method === 'PUT' && parts[1] === 'freelancers' && parts[2] && !parts[3]) {
    const b = await body(req);
    db.prepare('UPDATE freelancers SET name=?,title=?,bio=?,skills=?,hourly_rate=?,location=? WHERE id=?')
      .run(b.name, b.title, b.bio, b.skills, b.hourly_rate, b.location, parts[2]);
    return json(res, db.prepare('SELECT * FROM freelancers WHERE id=?').get(parts[2]));
  }

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

  // ── PORTFOLIO ─────────────────────────────────────────
  // GET /api/freelancers/:id/portfolio
  if (req.method === 'GET' && parts[1] === 'freelancers' && parts[2] && parts[3] === 'portfolio') {
    return json(res, db.prepare('SELECT * FROM portfolio WHERE freelancer_id=? ORDER BY created_at DESC').all(parts[2]));
  }

  // POST /api/freelancers/:id/portfolio
  if (req.method === 'POST' && parts[1] === 'freelancers' && parts[3] === 'portfolio') {
    const b = await body(req);
    const id = randomUUID();
    db.prepare('INSERT INTO portfolio (id,freelancer_id,title,description,tech,url) VALUES (?,?,?,?,?,?)')
      .run(id, parts[2], b.title, b.description || '', b.tech || '', b.url || '');
    return json(res, db.prepare('SELECT * FROM portfolio WHERE id=?').get(id), 201);
  }

  // DELETE /api/portfolio/:id
  if (req.method === 'DELETE' && parts[1] === 'portfolio' && parts[2]) {
    db.prepare('DELETE FROM portfolio WHERE id=?').run(parts[2]);
    return json(res, { ok: true });
  }

  // ── MESSAGES ──────────────────────────────────────────
  // GET /api/messages?user_id=... (all conversations for user)
  if (req.method === 'GET' && pathname === '/api/messages') {
    const { user_id, other_user_id, project_id } = qs;
    if (project_id && user_id && other_user_id) {
      // get thread
      const msgs = db.prepare(`
        SELECT * FROM messages
        WHERE project_id=?
          AND ((from_user_id=? AND to_user_id=?) OR (from_user_id=? AND to_user_id=?))
        ORDER BY created_at ASC
      `).all(project_id, user_id, other_user_id, other_user_id, user_id);
      // mark as read
      db.prepare('UPDATE messages SET is_read=1 WHERE to_user_id=? AND from_user_id=? AND project_id=?')
        .run(user_id, other_user_id, project_id);
      return json(res, msgs);
    }
    if (user_id) {
      // get list of unique conversations
      const convs = db.prepare(`
        SELECT DISTINCT
          CASE WHEN from_user_id=? THEN to_user_id ELSE from_user_id END as other_id,
          CASE WHEN from_user_id=? THEN (SELECT name FROM users WHERE id=to_user_id LIMIT 1)
               ELSE from_name END as other_name,
          project_id,
          (SELECT title FROM projects WHERE id=messages.project_id LIMIT 1) as project_title,
          (SELECT content FROM messages m2
           WHERE ((m2.from_user_id=messages.from_user_id AND m2.to_user_id=messages.to_user_id)
               OR (m2.from_user_id=messages.to_user_id AND m2.to_user_id=messages.from_user_id))
             AND m2.project_id=messages.project_id
           ORDER BY m2.created_at DESC LIMIT 1) as last_message,
          (SELECT created_at FROM messages m2
           WHERE ((m2.from_user_id=messages.from_user_id AND m2.to_user_id=messages.to_user_id)
               OR (m2.from_user_id=messages.to_user_id AND m2.to_user_id=messages.from_user_id))
             AND m2.project_id=messages.project_id
           ORDER BY m2.created_at DESC LIMIT 1) as last_at,
          (SELECT COUNT(*) FROM messages m2
           WHERE m2.to_user_id=? AND m2.from_user_id=(
             CASE WHEN messages.from_user_id=? THEN messages.to_user_id ELSE messages.from_user_id END
           ) AND m2.is_read=0 AND m2.project_id=messages.project_id) as unread
        FROM messages
        WHERE from_user_id=? OR to_user_id=?
        ORDER BY last_at DESC
      `).all(user_id, user_id, user_id, user_id, user_id, user_id);
      return json(res, convs);
    }
    return json(res, []);
  }

  // POST /api/messages
  if (req.method === 'POST' && pathname === '/api/messages') {
    const b = await body(req);
    const id = randomUUID();
    db.prepare('INSERT INTO messages (id,project_id,from_user_id,to_user_id,from_name,content) VALUES (?,?,?,?,?,?)')
      .run(id, b.project_id || null, b.from_user_id, b.to_user_id, b.from_name, b.content);
    // notify recipient
    db.prepare('INSERT INTO notifications (id,type,title,message,user_id) VALUES (?,?,?,?,?)')
      .run(randomUUID(), 'message', 'Жаңа хабарлама', `${b.from_name} сізге хабарлама жіберді`, b.to_user_id);
    return json(res, db.prepare('SELECT * FROM messages WHERE id=?').get(id), 201);
  }

  // ── NOTIFICATIONS ─────────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/notifications') {
    const { user_id } = qs;
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
