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
  const parts = pathname.split('/').filter(Boolean); // ['api', 'projects', ...]

  // GET /api/stats
  if (req.method === 'GET' && pathname === '/api/stats') {
    const totalProjects = db.prepare('SELECT COUNT(*) as c FROM projects').get().c;
    const openProjects = db.prepare("SELECT COUNT(*) as c FROM projects WHERE status='open'").get().c;
    const totalProposals = db.prepare('SELECT COUNT(*) as c FROM proposals').get().c;
    const totalRequirements = db.prepare('SELECT COUNT(*) as c FROM requirements').get().c;
    const byCategory = db.prepare('SELECT category, COUNT(*) as count FROM projects GROUP BY category').all();
    const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM projects GROUP BY status').all();
    const topFreelancers = db.prepare('SELECT freelancer_name, COUNT(*) as count FROM proposals GROUP BY freelancer_name ORDER BY count DESC LIMIT 5').all();
    return json(res, { totalProjects, openProjects, totalProposals, totalRequirements, byCategory, byStatus, topFreelancers });
  }

  // GET /api/projects
  if (req.method === 'GET' && pathname === '/api/projects') {
    const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
    return json(res, projects);
  }

  // POST /api/projects
  if (req.method === 'POST' && pathname === '/api/projects') {
    const b = await body(req);
    const id = randomUUID();
    db.prepare('INSERT INTO projects (id,title,description,category,budget,deadline,client_name,skills) VALUES (?,?,?,?,?,?,?,?)')
      .run(id, b.title, b.description, b.category||'web', b.budget||0, b.deadline||'', b.client_name||'Клиент', b.skills||'');
    return json(res, db.prepare('SELECT * FROM projects WHERE id=?').get(id), 201);
  }

  // GET /api/projects/:id
  if (req.method === 'GET' && parts[1] === 'projects' && parts[2] && !parts[3]) {
    const project = db.prepare('SELECT * FROM projects WHERE id=?').get(parts[2]);
    if (!project) return json(res, { error: 'Not found' }, 404);
    const proposals = db.prepare('SELECT * FROM proposals WHERE project_id=? ORDER BY created_at DESC').all(parts[2]);
    const requirements = db.prepare('SELECT * FROM requirements WHERE project_id=? ORDER BY created_at DESC').all(parts[2]);
    return json(res, { ...project, proposals, requirements });
  }

  // PUT /api/projects/:id
  if (req.method === 'PUT' && parts[1] === 'projects' && parts[2]) {
    const b = await body(req);
    db.prepare('UPDATE projects SET title=?,description=?,category=?,budget=?,deadline=?,status=?,client_name=?,skills=? WHERE id=?')
      .run(b.title, b.description, b.category, b.budget, b.deadline, b.status, b.client_name, b.skills, parts[2]);
    return json(res, db.prepare('SELECT * FROM projects WHERE id=?').get(parts[2]));
  }

  // DELETE /api/projects/:id
  if (req.method === 'DELETE' && parts[1] === 'projects' && parts[2]) {
    db.prepare('DELETE FROM proposals WHERE project_id=?').run(parts[2]);
    db.prepare('DELETE FROM requirements WHERE project_id=?').run(parts[2]);
    db.prepare('DELETE FROM projects WHERE id=?').run(parts[2]);
    return json(res, { ok: true });
  }

  // POST /api/projects/:id/proposals
  if (req.method === 'POST' && parts[1] === 'projects' && parts[3] === 'proposals') {
    const b = await body(req);
    const id = randomUUID();
    db.prepare('INSERT INTO proposals (id,project_id,freelancer_name,cover_letter,bid_amount,delivery_days) VALUES (?,?,?,?,?,?)')
      .run(id, parts[2], b.freelancer_name, b.cover_letter, b.bid_amount||0, b.delivery_days||7);
    return json(res, db.prepare('SELECT * FROM proposals WHERE id=?').get(id), 201);
  }

  // POST /api/projects/:id/requirements
  if (req.method === 'POST' && parts[1] === 'projects' && parts[3] === 'requirements') {
    const b = await body(req);
    const id = randomUUID();
    db.prepare('INSERT INTO requirements (id,project_id,title,description,type,priority,status) VALUES (?,?,?,?,?,?,?)')
      .run(id, parts[2], b.title, b.description||'', b.type||'functional', b.priority||'medium', b.status||'new');
    return json(res, db.prepare('SELECT * FROM requirements WHERE id=?').get(id), 201);
  }

  // PUT /api/requirements/:id
  if (req.method === 'PUT' && parts[1] === 'requirements' && parts[2]) {
    const b = await body(req);
    db.prepare('UPDATE requirements SET title=?,description=?,type=?,priority=?,status=? WHERE id=?')
      .run(b.title, b.description, b.type, b.priority, b.status, parts[2]);
    return json(res, db.prepare('SELECT * FROM requirements WHERE id=?').get(parts[2]));
  }

  json(res, { error: 'Not found' }, 404);
});

server.listen(PORT, () => console.log(`✅ Freelanzer backend: http://localhost:${PORT}`));
