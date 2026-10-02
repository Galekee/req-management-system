const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync(':memory:');

db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'web',
    budget INTEGER DEFAULT 0,
    deadline TEXT,
    status TEXT DEFAULT 'open',
    client_name TEXT DEFAULT 'Клиент',
    skills TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS proposals (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    freelancer_name TEXT NOT NULL,
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
`);

// Seed data
const count = db.prepare('SELECT COUNT(*) as c FROM projects').get();
if (count.c === 0) {
  const projects = [
    { id: 'p1', title: 'Интернет-дүкен сайты', description: 'Толық функционалды e-commerce сайт жасау керек. Өнімдер каталогы, себет, төлем жүйесі болуы тиіс.', category: 'web', budget: 150000, deadline: '2026-11-15', status: 'open', client_name: 'Асқар Беков', skills: 'React,Node.js,PostgreSQL' },
    { id: 'p2', title: 'Мобильді қосымша (iOS/Android)', description: 'Жеткізу сервисі үшін мобильді қосымша. Геолокация, push-notifications, онлайн төлем.', category: 'mobile', budget: 300000, deadline: '2026-12-01', status: 'open', client_name: 'Дина Сейткали', skills: 'React Native,Firebase' },
    { id: 'p3', title: 'Корпоративтік сайт редизайн', description: 'Ескі сайтты жаңарту керек. Жаңа дизайн, мобильге бейімдеу, SEO оңтайландыру.', category: 'design', budget: 80000, deadline: '2026-10-30', status: 'in_progress', client_name: 'Nurlan Corp', skills: 'Figma,HTML,CSS' },
    { id: 'p4', title: 'CRM жүйесі', description: 'Шағын бизнес үшін CRM жүйесі. Клиенттер базасы, тапсырмалар, есептер.', category: 'web', budget: 250000, deadline: '2026-12-20', status: 'open', client_name: 'Бизнес Плюс', skills: 'Vue.js,Python,MySQL' },
    { id: 'p5', title: 'Telegram бот', description: 'Сауда орталығы үшін Telegram бот. Өнімдер каталогы, тапсырыс қабылдау, хабарландырулар.', category: 'bot', budget: 50000, deadline: '2026-10-25', status: 'completed', client_name: 'Мега Молл', skills: 'Python,Telegram API' },
  ];

  const insertProject = db.prepare('INSERT INTO projects (id,title,description,category,budget,deadline,status,client_name,skills) VALUES (?,?,?,?,?,?,?,?,?)');
  for (const p of projects) {
    insertProject.run(p.id, p.title, p.description, p.category, p.budget, p.deadline, p.status, p.client_name, p.skills);
  }

  const proposals = [
    { id: 'pr1', project_id: 'p1', freelancer_name: 'Бекарыс Балапан', cover_letter: 'Мен React және Node.js-те 3 жыл тәжірибем бар. Сіздің жобаңызды сапалы орындаймын.', bid_amount: 140000, delivery_days: 30, status: 'pending' },
    { id: 'pr2', project_id: 'p1', freelancer_name: 'Саят Газезов', cover_letter: 'E-commerce жобаларда тәжірибем бар. Дизайннан бастап деплойға дейін жасаймын.', bid_amount: 155000, delivery_days: 25, status: 'pending' },
    { id: 'pr3', project_id: 'p2', freelancer_name: 'Бекарыс Балапан', cover_letter: 'React Native-де бірнеше қосымша жасадым. Геолокация мен push notification тәжірибем бар.', bid_amount: 280000, delivery_days: 45, status: 'accepted' },
    { id: 'pr4', project_id: 'p3', freelancer_name: 'Саят Газезов', cover_letter: 'UI/UX дизайн және фронтенд бағытымда күшті тәжірибем бар.', bid_amount: 75000, delivery_days: 14, status: 'accepted' },
  ];

  const insertProposal = db.prepare('INSERT INTO proposals (id,project_id,freelancer_name,cover_letter,bid_amount,delivery_days,status) VALUES (?,?,?,?,?,?,?)');
  for (const p of proposals) {
    insertProposal.run(p.id, p.project_id, p.freelancer_name, p.cover_letter, p.bid_amount, p.delivery_days, p.status);
  }

  const requirements = [
    { id: 'r1', project_id: 'p1', title: 'Пайдаланушы тіркелуі', description: 'Email және Google арқылы тіркелу мүмкіндігі', type: 'functional', priority: 'high', status: 'approved' },
    { id: 'r2', project_id: 'p1', title: 'Өнімдер каталогы', description: 'Категория, фильтр, іздеу функциялары', type: 'functional', priority: 'high', status: 'in_progress' },
    { id: 'r3', project_id: 'p1', title: 'Жүктелу жылдамдығы', description: 'Бет 2 секундта жүктелуі тиіс', type: 'non_functional', priority: 'medium', status: 'new' },
    { id: 'r4', project_id: 'p2', title: 'Геолокация', description: 'GPS арқылы орынды анықтау', type: 'functional', priority: 'high', status: 'approved' },
    { id: 'r5', project_id: 'p2', title: 'Push notifications', description: 'Тапсырыс статусы туралы хабарландыру', type: 'functional', priority: 'medium', status: 'new' },
  ];

  const insertReq = db.prepare('INSERT INTO requirements (id,project_id,title,description,type,priority,status) VALUES (?,?,?,?,?,?,?)');
  for (const r of requirements) {
    insertReq.run(r.id, r.project_id, r.title, r.description, r.type, r.priority, r.status);
  }
}

module.exports = db;
