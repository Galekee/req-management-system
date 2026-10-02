const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'requirements.db'));

// WAL режим
db.exec('PRAGMA journal_mode = WAL;');

// Таблицалар жасау
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

// Тестілік деректер
const count = db.prepare('SELECT COUNT(*) as count FROM requirements').get();
if (count.count === 0) {
  const now = new Date().toISOString();
  const samples = [
    ['req-001', 'Пайдаланушы аутентификациясы', 'Жүйе пайдаланушының логин мен парольді тексеруі тиіс', 'functional', 'high', 'approved', 'Бекарыс', 'Қауіпсіздік'],
    ['req-002', 'Талаптарды тізімдеу', 'Барлық талаптарды кесте түрінде көрсету', 'functional', 'high', 'in_progress', 'Бекарыс', 'UI'],
    ['req-003', 'Өнімділік талабы', 'Жүйе 200 бір мезгілдегі пайдаланушыны p95 < 800мс кезінде қолдауы тиіс', 'non_functional', 'high', 'new', 'Саят', 'Өнімділік'],
    ['req-004', 'Деректерді экспорттау', 'Талаптарды PDF және Excel форматында экспорттау', 'functional', 'medium', 'new', 'Саят', 'Интеграция'],
    ['req-005', 'Қауіпсіздік талабы', 'Барлық API сұраныстары JWT токенмен авторизацияланған болуы тиіс', 'non_functional', 'high', 'in_progress', 'Бекарыс', 'Қауіпсіздік'],
    ['req-006', 'Хабарлама жүйесі', 'Талаптың статусы өзгергенде email хабарлама жіберу', 'functional', 'low', 'rejected', 'Саят', 'Интеграция'],
    ['req-007', 'Сақтық көшірме', 'Деректер базасының күнделікті автоматты сақтық көшірмесі', 'non_functional', 'medium', 'approved', 'Саят', 'Инфрақұрылым'],
  ];

  const insert = db.prepare(`
    INSERT INTO requirements (id, title, description, type, priority, status, assignee, category, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const s of samples) {
    insert.run(s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], now, now);
  }
}

module.exports = db;
