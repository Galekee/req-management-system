const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync(':memory:');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'client',
    name TEXT NOT NULL,
    is_approved INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'web',
    budget INTEGER DEFAULT 0,
    deadline TEXT,
    status TEXT DEFAULT 'open',
    client_name TEXT DEFAULT 'Клиент',
    client_id TEXT,
    skills TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS proposals (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    freelancer_name TEXT NOT NULL,
    freelancer_id TEXT,
    cover_letter TEXT,
    bid_amount INTEGER DEFAULT 0,
    delivery_days INTEGER DEFAULT 7,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS requirements (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'functional',
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'new',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS freelancers (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    title TEXT DEFAULT 'Фрилансер',
    bio TEXT DEFAULT '',
    skills TEXT DEFAULT '',
    hourly_rate INTEGER DEFAULT 0,
    location TEXT DEFAULT 'Қазақстан',
    avatar_color TEXT DEFAULT '#6366f1',
    total_earned INTEGER DEFAULT 0,
    jobs_done INTEGER DEFAULT 0,
    is_approved INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    freelancer_id TEXT NOT NULL,
    project_id TEXT,
    client_name TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    comment TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (freelancer_id) REFERENCES freelancers(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    type TEXT DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT DEFAULT '',
    user_id TEXT,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

const count = db.prepare('SELECT COUNT(*) as c FROM users').get();
if (count.c === 0) {
  // Seed users
  const users = [
    { id: 'u0', email: 'admin@freelanzer.kz', password: 'admin123', role: 'admin', name: 'Администратор', is_approved: 1 },
    { id: 'u1', email: 'askar@mail.kz', password: 'client123', role: 'client', name: 'Асқар Беков', is_approved: 1 },
    { id: 'u2', email: 'dina@mail.kz', password: 'client123', role: 'client', name: 'Дина Сейткали', is_approved: 1 },
    { id: 'u3', email: 'bekarys@mail.kz', password: 'free123', role: 'freelancer', name: 'Бекарыс Балапан', is_approved: 1 },
    { id: 'u4', email: 'saya@mail.kz', password: 'free123', role: 'freelancer', name: 'Саят Газезов', is_approved: 1 },
    { id: 'u5', email: 'asel@mail.kz', password: 'free123', role: 'freelancer', name: 'Асель Нурова', is_approved: 0 },
  ];
  const insertUser = db.prepare('INSERT INTO users (id,email,password,role,name,is_approved) VALUES (?,?,?,?,?,?)');
  for (const u of users) insertUser.run(u.id, u.email, u.password, u.role, u.name, u.is_approved);

  // Seed projects
  const projects = [
    { id: 'p1', title: 'Интернет-дүкен сайты', description: 'Толық функционалды e-commerce сайт жасау керек. Өнімдер каталогы, себет, төлем жүйесі болуы тиіс.', category: 'web', budget: 150000, deadline: '2026-11-15', status: 'open', client_name: 'Асқар Беков', client_id: 'u1', skills: 'React,Node.js,PostgreSQL' },
    { id: 'p2', title: 'Мобильді қосымша (iOS/Android)', description: 'Жеткізу сервисі үшін мобильді қосымша. Геолокация, push-notifications, онлайн төлем.', category: 'mobile', budget: 300000, deadline: '2026-12-01', status: 'open', client_name: 'Дина Сейткали', client_id: 'u2', skills: 'React Native,Firebase' },
    { id: 'p3', title: 'Корпоративтік сайт редизайн', description: 'Ескі сайтты жаңарту керек. Жаңа дизайн, мобильге бейімдеу, SEO оңтайландыру.', category: 'design', budget: 80000, deadline: '2026-10-30', status: 'in_progress', client_name: 'Nurlan Corp', client_id: 'u1', skills: 'Figma,HTML,CSS' },
    { id: 'p4', title: 'CRM жүйесі', description: 'Шағын бизнес үшін CRM жүйесі. Клиенттер базасы, тапсырмалар, есептер.', category: 'web', budget: 250000, deadline: '2026-12-20', status: 'open', client_name: 'Бизнес Плюс', client_id: 'u2', skills: 'Vue.js,Python,MySQL' },
    { id: 'p5', title: 'Telegram бот', description: 'Сауда орталығы үшін Telegram бот. Өнімдер каталогы, тапсырыс қабылдау, хабарландырулар.', category: 'bot', budget: 50000, deadline: '2026-10-25', status: 'completed', client_name: 'Мега Молл', client_id: 'u1', skills: 'Python,Telegram API' },
  ];
  const insertProject = db.prepare('INSERT INTO projects (id,title,description,category,budget,deadline,status,client_name,client_id,skills) VALUES (?,?,?,?,?,?,?,?,?,?)');
  for (const p of projects) insertProject.run(p.id, p.title, p.description, p.category, p.budget, p.deadline, p.status, p.client_name, p.client_id, p.skills);

  // Seed proposals
  const proposals = [
    { id: 'pr1', project_id: 'p1', freelancer_name: 'Бекарыс Балапан', freelancer_id: 'u3', cover_letter: 'Мен React және Node.js-те 3 жыл тәжірибем бар. Сіздің жобаңызды сапалы орындаймын.', bid_amount: 140000, delivery_days: 30, status: 'pending' },
    { id: 'pr2', project_id: 'p1', freelancer_name: 'Саят Газезов', freelancer_id: 'u4', cover_letter: 'E-commerce жобаларда тәжірибем бар. Дизайннан бастап деплойға дейін жасаймын.', bid_amount: 155000, delivery_days: 25, status: 'pending' },
    { id: 'pr3', project_id: 'p2', freelancer_name: 'Бекарыс Балапан', freelancer_id: 'u3', cover_letter: 'React Native-де бірнеше қосымша жасадым.', bid_amount: 280000, delivery_days: 45, status: 'accepted' },
    { id: 'pr4', project_id: 'p3', freelancer_name: 'Саят Газезов', freelancer_id: 'u4', cover_letter: 'UI/UX дизайн және фронтенд бағытымда күшті тәжірибем бар.', bid_amount: 75000, delivery_days: 14, status: 'accepted' },
  ];
  const insertProposal = db.prepare('INSERT INTO proposals (id,project_id,freelancer_name,freelancer_id,cover_letter,bid_amount,delivery_days,status) VALUES (?,?,?,?,?,?,?,?)');
  for (const p of proposals) insertProposal.run(p.id, p.project_id, p.freelancer_name, p.freelancer_id, p.cover_letter, p.bid_amount, p.delivery_days, p.status);

  // Seed requirements
  const requirements = [
    { id: 'r1', project_id: 'p1', title: 'Пайдаланушы тіркелуі', description: 'Email және Google арқылы тіркелу', type: 'functional', priority: 'high', status: 'approved' },
    { id: 'r2', project_id: 'p1', title: 'Өнімдер каталогы', description: 'Категория, фильтр, іздеу', type: 'functional', priority: 'high', status: 'in_progress' },
    { id: 'r3', project_id: 'p1', title: 'Жүктелу жылдамдығы', description: 'Бет 2 секундта жүктелуі тиіс', type: 'non_functional', priority: 'medium', status: 'new' },
    { id: 'r4', project_id: 'p2', title: 'Геолокация', description: 'GPS арқылы орынды анықтау', type: 'functional', priority: 'high', status: 'approved' },
    { id: 'r5', project_id: 'p2', title: 'Push notifications', description: 'Тапсырыс статусы туралы хабарландыру', type: 'functional', priority: 'medium', status: 'new' },
  ];
  const insertReq = db.prepare('INSERT INTO requirements (id,project_id,title,description,type,priority,status) VALUES (?,?,?,?,?,?,?)');
  for (const r of requirements) insertReq.run(r.id, r.project_id, r.title, r.description, r.type, r.priority, r.status);

  // Seed freelancers
  const freelancers = [
    { id: 'f1', user_id: 'u3', name: 'Бекарыс Балапан', title: 'Full-Stack Developer', bio: 'React, Node.js және мобильді қосымшалар бойынша 3 жыл тәжірибе. 20+ жоба сәтті аяқтадым.', skills: 'React,Node.js,React Native,PostgreSQL', hourly_rate: 5000, location: 'Алматы', avatar_color: '#6366f1', total_earned: 420000, jobs_done: 8, is_approved: 1 },
    { id: 'f2', user_id: 'u4', name: 'Саят Газезов', title: 'UI/UX Designer & Frontend', bio: 'Figma, HTML/CSS және Vue.js бойынша маман. Корпоративтік сайттар мен мобильді дизайн.', skills: 'Figma,HTML,CSS,Vue.js,JavaScript', hourly_rate: 4000, location: 'Астана', avatar_color: '#a855f7', total_earned: 155000, jobs_done: 5, is_approved: 1 },
    { id: 'f3', user_id: 'u5', name: 'Асель Нурова', title: 'Backend Developer', bio: 'Python және Django бойынша маман. REST API, микросервистер.', skills: 'Python,Django,PostgreSQL,Docker', hourly_rate: 4500, location: 'Алматы', avatar_color: '#ec4899', total_earned: 0, jobs_done: 0, is_approved: 0 },
  ];
  const insertF = db.prepare('INSERT INTO freelancers (id,user_id,name,title,bio,skills,hourly_rate,location,avatar_color,total_earned,jobs_done,is_approved) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
  for (const f of freelancers) insertF.run(f.id, f.user_id, f.name, f.title, f.bio, f.skills, f.hourly_rate, f.location, f.avatar_color, f.total_earned, f.jobs_done, f.is_approved);

  // Seed reviews
  const reviews = [
    { id: 'rv1', freelancer_id: 'f1', project_id: 'p2', client_name: 'Дина Сейткали', rating: 5, comment: 'Өте жақсы жұмыс! Уақытында орындады, кәсіби маман.' },
    { id: 'rv2', freelancer_id: 'f1', project_id: 'p1', client_name: 'Асқар Беков', rating: 4, comment: 'Жақсы нәтиже, кішігірім кешігулер болды бірақ сапа жоғары.' },
    { id: 'rv3', freelancer_id: 'f2', project_id: 'p3', client_name: 'Nurlan Corp', rating: 5, comment: 'Дизайн өте ұнады! Барлық тілектерді ескерді.' },
  ];
  const insertRv = db.prepare('INSERT INTO reviews (id,freelancer_id,project_id,client_name,rating,comment) VALUES (?,?,?,?,?,?)');
  for (const r of reviews) insertRv.run(r.id, r.freelancer_id, r.project_id, r.client_name, r.rating, r.comment);

  // Seed notifications
  const notifications = [
    { id: 'n1', type: 'proposal', title: 'Жаңа өтінім келді', message: '"Интернет-дүкен сайты" жобасына Бекарыс Балапан өтінім берді', user_id: 'u1', is_read: 0 },
    { id: 'n2', type: 'proposal', title: 'Жаңа өтінім келді', message: '"Интернет-дүкен сайты" жобасына Саят Газезов өтінім берді', user_id: 'u1', is_read: 0 },
    { id: 'n3', type: 'review', title: 'Жаңа пікір қалдырылды', message: 'Дина Сейткали сізге 5 жұлдыз берді', user_id: 'u3', is_read: 1 },
    { id: 'n4', type: 'project', title: 'Жоба аяқталды', message: '"Telegram бот" жобасы сәтті аяқталды', user_id: 'u1', is_read: 1 },
    { id: 'n5', type: 'info', title: 'Тіркелу сұранысы', message: 'Асель Нурова фрилансер ретінде тіркелу сұранысын жіберді', user_id: 'u0', is_read: 0 },
  ];
  const insertN = db.prepare('INSERT INTO notifications (id,type,title,message,user_id,is_read) VALUES (?,?,?,?,?,?)');
  for (const n of notifications) insertN.run(n.id, n.type, n.title, n.message, n.user_id, n.is_read);
}

module.exports = db;
