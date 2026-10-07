from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import uuid
from datetime import datetime, timezone, timedelta

app = Flask(__name__)
CORS(app)

TZ5 = timezone(timedelta(hours=5))

def now_str():
    return datetime.now(TZ5).strftime('%Y-%m-%d %H:%M:%S')

# In-memory SQLite — one connection for whole app lifetime
conn = sqlite3.connect(':memory:', check_same_thread=False)
conn.row_factory = sqlite3.Row

def q(sql, params=()):
    return conn.execute(sql, params)

def qone(sql, params=()):
    r = conn.execute(sql, params).fetchone()
    return dict(r) if r else None

def qall(sql, params=()):
    return [dict(r) for r in conn.execute(sql, params).fetchall()]

def new_id():
    return str(uuid.uuid4())

# ── Schema ────────────────────────────────────────────────────────────────────
conn.executescript("""
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'client',
    name TEXT NOT NULL,
    is_approved INTEGER DEFAULT 1,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'web',
    budget INTEGER DEFAULT 0,
    deadline TEXT,
    status TEXT DEFAULT 'open',
    progress INTEGER DEFAULT 0,
    client_name TEXT DEFAULT 'Клиент',
    client_id TEXT,
    skills TEXT DEFAULT '',
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    is_done INTEGER DEFAULT 0,
    created_at TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id)
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
    created_at TEXT,
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
    created_at TEXT,
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
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS portfolio (
    id TEXT PRIMARY KEY,
    freelancer_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    tech TEXT DEFAULT '',
    url TEXT DEFAULT '',
    created_at TEXT,
    FOREIGN KEY (freelancer_id) REFERENCES freelancers(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    freelancer_id TEXT NOT NULL,
    project_id TEXT,
    client_name TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    comment TEXT DEFAULT '',
    created_at TEXT,
    FOREIGN KEY (freelancer_id) REFERENCES freelancers(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    from_user_id TEXT NOT NULL,
    to_user_id TEXT NOT NULL,
    from_name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    type TEXT DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT DEFAULT '',
    user_id TEXT,
    is_read INTEGER DEFAULT 0,
    created_at TEXT
  );
""")

# ── Seed data ─────────────────────────────────────────────────────────────────
count = qone('SELECT COUNT(*) as c FROM users')['c']
if count == 0:
    ts = now_str()

    users = [
        ('u0', 'admin@freelanzer.kz', 'admin123', 'admin',      'Администратор',   1),
        ('u1', 'askar@mail.kz',       'client123','client',     'Асқар Беков',     1),
        ('u2', 'dina@mail.kz',        'client123','client',     'Дина Сейткали',   1),
        ('u3', 'bekarys@mail.kz',     'free123',  'freelancer', 'Бекарыс Балапан', 1),
        ('u4', 'saya@mail.kz',        'free123',  'freelancer', 'Саят Газезов',    1),
        ('u5', 'asel@mail.kz',        'free123',  'freelancer', 'Асель Нурова',    0),
    ]
    for u in users:
        conn.execute('INSERT INTO users (id,email,password,role,name,is_approved,created_at) VALUES (?,?,?,?,?,?,?)', u + (ts,))

    projects = [
        ('p1','Интернет-дүкен сайты','Толық функционалды e-commerce сайт жасау керек. Өнімдер каталогы, себет, төлем жүйесі болуы тиіс.','web',150000,'2026-11-15','open',0,'Асқар Беков','u1','React,Node.js,PostgreSQL'),
        ('p2','Мобильді қосымша (iOS/Android)','Жеткізу сервисі үшін мобильді қосымша. Геолокация, push-notifications, онлайн төлем.','mobile',300000,'2026-12-01','in_progress',40,'Дина Сейткали','u2','React Native,Firebase'),
        ('p3','Корпоративтік сайт редизайн','Ескі сайтты жаңарту керек. Жаңа дизайн, мобильге бейімдеу, SEO оңтайландыру.','design',80000,'2026-10-30','in_progress',70,'Nurlan Corp','u1','Figma,HTML,CSS'),
        ('p4','CRM жүйесі','Шағын бизнес үшін CRM жүйесі. Клиенттер базасы, тапсырмалар, есептер.','web',250000,'2026-12-20','open',0,'Бизнес Плюс','u2','Vue.js,Python,MySQL'),
        ('p5','Telegram бот','Сауда орталығы үшін Telegram бот. Өнімдер каталогы, тапсырыс қабылдау, хабарландырулар.','bot',50000,'2026-10-25','completed',100,'Мега Молл','u1','Python,Telegram API'),
    ]
    for p in projects:
        conn.execute('INSERT INTO projects (id,title,description,category,budget,deadline,status,progress,client_name,client_id,skills,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', p + (ts,))

    milestones = [
        ('m1','p2','Дизайн макеттері дайын',1),
        ('m2','p2','Авторизация жүйесі',1),
        ('m3','p2','Геолокация модулі',0),
        ('m4','p2','Push notifications',0),
        ('m5','p2','Онлайн төлем интеграциясы',0),
        ('m6','p3','Wireframe бекітілді',1),
        ('m7','p3','Негізгі бет дайын',1),
        ('m8','p3','Ішкі беттер',1),
        ('m9','p3','Мобайл адаптация',0),
        ('p5m1','p5','Бот архитектурасы',1),
        ('p5m2','p5','Каталог модулі',1),
        ('p5m3','p5','Тапсырыс жүйесі',1),
        ('p5m4','p5','Тестілеу және деплой',1),
    ]
    for m in milestones:
        conn.execute('INSERT INTO milestones (id,project_id,title,is_done,created_at) VALUES (?,?,?,?,?)', m + (ts,))

    proposals = [
        ('pr1','p1','Бекарыс Балапан','u3','Мен React және Node.js-те 3 жыл тәжірибем бар. Сіздің жобаңызды сапалы орындаймын.',140000,30,'pending'),
        ('pr2','p1','Саят Газезов','u4','E-commerce жобаларда тәжірибем бар. Дизайннан бастап деплойға дейін жасаймын.',155000,25,'pending'),
        ('pr3','p2','Бекарыс Балапан','u3','React Native-де бірнеше қосымша жасадым.',280000,45,'accepted'),
        ('pr4','p3','Саят Газезов','u4','UI/UX дизайн және фронтенд бағытымда күшті тәжірибем бар.',75000,14,'accepted'),
    ]
    for p in proposals:
        conn.execute('INSERT INTO proposals (id,project_id,freelancer_name,freelancer_id,cover_letter,bid_amount,delivery_days,status,created_at) VALUES (?,?,?,?,?,?,?,?,?)', p + (ts,))

    requirements = [
        ('r1','p1','Пайдаланушы тіркелуі','Email және Google арқылы тіркелу','functional','high','approved'),
        ('r2','p1','Өнімдер каталогы','Категория, фильтр, іздеу','functional','high','in_progress'),
        ('r3','p1','Жүктелу жылдамдығы','Бет 2 секундта жүктелуі тиіс','non_functional','medium','new'),
        ('r4','p2','Геолокация','GPS арқылы орынды анықтау','functional','high','approved'),
        ('r5','p2','Push notifications','Тапсырыс статусы туралы хабарландыру','functional','medium','new'),
    ]
    for r in requirements:
        conn.execute('INSERT INTO requirements (id,project_id,title,description,type,priority,status,created_at) VALUES (?,?,?,?,?,?,?,?)', r + (ts,))

    freelancers = [
        ('f1','u3','Бекарыс Балапан','Full-Stack Developer','React, Node.js және мобильді қосымшалар бойынша 3 жыл тәжірибе. 20+ жоба сәтті аяқтадым.','React,Node.js,React Native,PostgreSQL',5000,'Алматы','#6366f1',420000,8,1),
        ('f2','u4','Саят Газезов','UI/UX Designer & Frontend','Figma, HTML/CSS және Vue.js бойынша маман. Корпоративтік сайттар мен мобильді дизайн.','Figma,HTML,CSS,Vue.js,JavaScript',4000,'Астана','#a855f7',155000,5,1),
        ('f3','u5','Асель Нурова','Backend Developer','Python және Django бойынша маман. REST API, микросервистер.','Python,Django,PostgreSQL,Docker',4500,'Алматы','#ec4899',0,0,0),
    ]
    for f in freelancers:
        conn.execute('INSERT INTO freelancers (id,user_id,name,title,bio,skills,hourly_rate,location,avatar_color,total_earned,jobs_done,is_approved,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', f + (ts,))

    portfolio = [
        ('pf1','f1','E-commerce платформа','React + Node.js + PostgreSQL стекінде жасалған онлайн дүкен. 10 000+ өнім, себет, төлем жүйесі.','React,Node.js,PostgreSQL','https://github.com'),
        ('pf2','f1','Delivery мобайл қосымша','React Native-де жасалған жеткізу қосымшасы. iOS және Android. Геолокация, push notifications.','React Native,Firebase','https://github.com'),
        ('pf3','f1','HR жүйесі','Корпоративтік HR жүйесі. Қызметкерлер базасы, жалақы есебі, демалыс сұраныстары.','Vue.js,Laravel,MySQL','https://github.com'),
        ('pf4','f2','SaaS дашборд дизайны','B2B SaaS өнімі үшін Figma-да жасалған толық дизайн жүйесі. 40+ экран, компоненттер кітапханасы.','Figma,Illustrator','https://dribbble.com'),
        ('pf5','f2','Корпоративтік сайт','IT компания үшін жаңа корпоративтік сайт. Анимациялар, параллакс, мобайл адаптация.','HTML,CSS,GSAP,JavaScript','https://github.com'),
    ]
    for p in portfolio:
        conn.execute('INSERT INTO portfolio (id,freelancer_id,title,description,tech,url,created_at) VALUES (?,?,?,?,?,?,?)', p + (ts,))

    reviews = [
        ('rv1','f1','p2','Дина Сейткали',5,'Өте жақсы жұмыс! Уақытында орындады, кәсіби маман.'),
        ('rv2','f1','p1','Асқар Беков',4,'Жақсы нәтиже, кішігірім кешігулер болды бірақ сапа жоғары.'),
        ('rv3','f2','p3','Nurlan Corp',5,'Дизайн өте ұнады! Барлық тілектерді ескерді.'),
    ]
    for r in reviews:
        conn.execute('INSERT INTO reviews (id,freelancer_id,project_id,client_name,rating,comment,created_at) VALUES (?,?,?,?,?,?,?)', r + (ts,))

    messages = [
        ('msg1','p2','u2','u3','Дина Сейткали','Сәлем! Жобаны қашан бастауға болады?',1),
        ('msg2','p2','u3','u2','Бекарыс Балапан','Сәлем! Ертең бастауға дайынмын. Техникалық тапсырманы жіберіңіз.',1),
        ('msg3','p2','u2','u3','Дина Сейткали','Figma сілтемесін жіберемін. Дизайнға сай жасауыңызды сұраймын.',0),
    ]
    for m in messages:
        conn.execute('INSERT INTO messages (id,project_id,from_user_id,to_user_id,from_name,content,is_read,created_at) VALUES (?,?,?,?,?,?,?,?)', m + (ts,))

    notifications = [
        ('n1','proposal','Жаңа өтінім келді','"Интернет-дүкен сайты" жобасына Бекарыс Балапан өтінім берді','u1',0),
        ('n2','proposal','Жаңа өтінім келді','"Интернет-дүкен сайты" жобасына Саят Газезов өтінім берді','u1',0),
        ('n3','review','Жаңа пікір қалдырылды','Дина Сейткали сізге 5 жұлдыз берді','u3',1),
        ('n4','project','Жоба аяқталды','"Telegram бот" жобасы сәтті аяқталды','u1',1),
        ('n5','info','Тіркелу сұранысы','Асель Нурова фрилансер ретінде тіркелу сұранысын жіберді','u0',0),
        ('n6','message','Жаңа хабарлама','Дина Сейткали сізге хабарлама жіберді','u3',0),
    ]
    for n in notifications:
        conn.execute('INSERT INTO notifications (id,type,title,message,user_id,is_read,created_at) VALUES (?,?,?,?,?,?,?)', n + (ts,))

    conn.commit()

# ── AUTH ──────────────────────────────────────────────────────────────────────
@app.route('/api/auth/login', methods=['POST'])
def login():
    b = request.get_json(force=True, silent=True) or {}
    user = qone('SELECT * FROM users WHERE email=? AND password=?', (b.get('email'), b.get('password')))
    if not user:
        return jsonify({'error': 'Қате email немесе пароль'}), 401
    user.pop('password', None)
    return jsonify(user)

@app.route('/api/auth/register', methods=['POST'])
def register():
    b = request.get_json(force=True, silent=True) or {}
    exists = qone('SELECT id FROM users WHERE email=?', (b.get('email'),))
    if exists:
        return jsonify({'error': 'Бұл email тіркелген'}), 400
    uid = new_id()
    role = b.get('role', 'client')
    is_approved = 1 if role == 'client' else 0
    ts = now_str()
    conn.execute('INSERT INTO users (id,email,password,role,name,is_approved,created_at) VALUES (?,?,?,?,?,?,?)',
                 (uid, b.get('email'), b.get('password'), role, b.get('name'), is_approved, ts))
    if role == 'freelancer':
        fid = new_id()
        conn.execute('INSERT INTO freelancers (id,user_id,name,title,bio,skills,hourly_rate,location,avatar_color,is_approved,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
                     (fid, uid, b.get('name'), b.get('title', 'Фрилансер'), b.get('bio', ''),
                      b.get('skills', ''), b.get('hourly_rate', 0), b.get('location', 'Қазақстан'), '#6366f1', 0, ts))
        conn.execute('INSERT INTO notifications (id,type,title,message,user_id,created_at) VALUES (?,?,?,?,?,?)',
                     (new_id(), 'info', 'Жаңа тіркелу сұранысы', f"{b.get('name')} фрилансер ретінде тіркелгісі келеді", 'u0', ts))
    conn.commit()
    user = qone('SELECT * FROM users WHERE id=?', (uid,))
    user.pop('password', None)
    return jsonify(user), 201

# ── ADMIN ─────────────────────────────────────────────────────────────────────
@app.route('/api/admin/users', methods=['GET'])
def admin_users():
    return jsonify(qall('SELECT id,email,role,name,is_approved,created_at FROM users ORDER BY created_at DESC'))

@app.route('/api/admin/users/<uid>/approve', methods=['PUT'])
def admin_approve(uid):
    ts = now_str()
    conn.execute('UPDATE users SET is_approved=1 WHERE id=?', (uid,))
    conn.execute('UPDATE freelancers SET is_approved=1 WHERE user_id=?', (uid,))
    conn.execute('INSERT INTO notifications (id,type,title,message,user_id,created_at) VALUES (?,?,?,?,?,?)',
                 (new_id(), 'info', 'Тіркелуіңіз бекітілді', 'Платформаға қош келдіңіз! Жұмыс табуға болады.', uid, ts))
    conn.commit()
    return jsonify({'ok': True})

@app.route('/api/admin/users/<uid>/reject', methods=['PUT'])
def admin_reject(uid):
    conn.execute('UPDATE users SET is_approved=0 WHERE id=?', (uid,))
    conn.execute('UPDATE freelancers SET is_approved=0 WHERE user_id=?', (uid,))
    conn.commit()
    return jsonify({'ok': True})

@app.route('/api/admin/users/<uid>', methods=['DELETE'])
def admin_delete_user(uid):
    conn.execute('DELETE FROM freelancers WHERE user_id=?', (uid,))
    conn.execute('DELETE FROM users WHERE id=?', (uid,))
    conn.commit()
    return jsonify({'ok': True})

# ── STATS ─────────────────────────────────────────────────────────────────────
@app.route('/api/stats', methods=['GET'])
def stats():
    user_id = request.args.get('user_id')
    total_projects     = qone('SELECT COUNT(*) as c FROM projects')['c']
    open_projects      = qone("SELECT COUNT(*) as c FROM projects WHERE status='open'")['c']
    total_proposals    = qone('SELECT COUNT(*) as c FROM proposals')['c']
    total_requirements = qone('SELECT COUNT(*) as c FROM requirements')['c']
    by_category        = qall('SELECT category, COUNT(*) as count FROM projects GROUP BY category')
    by_status          = qall('SELECT status, COUNT(*) as count FROM projects GROUP BY status')
    top_freelancers    = qall('SELECT freelancer_name, COUNT(*) as count FROM proposals GROUP BY freelancer_name ORDER BY count DESC LIMIT 5')
    total_users        = qone('SELECT COUNT(*) as c FROM users')['c']
    pending_approvals  = qone("SELECT COUNT(*) as c FROM users WHERE is_approved=0 AND role='freelancer'")['c']

    if user_id:
        unread_count = qone('SELECT COUNT(*) as c FROM notifications WHERE is_read=0 AND (user_id=? OR user_id IS NULL)', (user_id,))['c']
    else:
        unread_count = qone('SELECT COUNT(*) as c FROM notifications WHERE is_read=0')['c']

    unread_messages = qone('SELECT COUNT(*) as c FROM messages WHERE to_user_id=? AND is_read=0', (user_id,))['c'] if user_id else 0

    monthly_projects = list(reversed(qall(
        "SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count FROM projects GROUP BY month ORDER BY month DESC LIMIT 6"
    )))

    my_earnings = None
    if user_id:
        my_earnings = list(reversed(qall(
            "SELECT strftime('%Y-%m', p.created_at) as month, COALESCE(SUM(pr.bid_amount),0) as earned "
            "FROM proposals pr JOIN projects p ON pr.project_id=p.id "
            "WHERE pr.freelancer_id=? AND pr.status='accepted' GROUP BY month ORDER BY month DESC LIMIT 6",
            (user_id,)
        )))

    return jsonify({
        'totalProjects': total_projects,
        'openProjects': open_projects,
        'totalProposals': total_proposals,
        'totalRequirements': total_requirements,
        'byCategory': by_category,
        'byStatus': by_status,
        'topFreelancers': top_freelancers,
        'unreadCount': unread_count,
        'unreadMessages': unread_messages,
        'totalUsers': total_users,
        'pendingApprovals': pending_approvals,
        'monthlyProjects': monthly_projects,
        'myEarnings': my_earnings,
    })

# ── PROJECTS ──────────────────────────────────────────────────────────────────
@app.route('/api/projects', methods=['GET'])
def get_projects():
    client_id = request.args.get('client_id')
    status    = request.args.get('status')
    category  = request.args.get('category')
    search    = request.args.get('search')
    sql = 'SELECT * FROM projects'
    params = []
    conds = []
    if client_id: conds.append('client_id=?');  params.append(client_id)
    if status:    conds.append('status=?');      params.append(status)
    if category:  conds.append('category=?');    params.append(category)
    if search:    conds.append('(title LIKE ? OR description LIKE ?)'); params += [f'%{search}%', f'%{search}%']
    if conds: sql += ' WHERE ' + ' AND '.join(conds)
    sql += ' ORDER BY created_at DESC'
    return jsonify(qall(sql, params))

@app.route('/api/projects', methods=['POST'])
def create_project():
    b = request.get_json(force=True, silent=True) or {}
    pid = new_id()
    ts = now_str()
    conn.execute('INSERT INTO projects (id,title,description,category,budget,deadline,client_name,client_id,skills,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
                 (pid, b.get('title'), b.get('description'), b.get('category', 'web'),
                  b.get('budget', 0), b.get('deadline', ''), b.get('client_name', 'Клиент'),
                  b.get('client_id'), b.get('skills', ''), ts))
    conn.execute('INSERT INTO notifications (id,type,title,message,created_at) VALUES (?,?,?,?,?)',
                 (new_id(), 'project', 'Жаңа жоба жарияланды', f'"{b.get("title")}" жобасы платформада жарияланды', ts))
    conn.commit()
    return jsonify(qone('SELECT * FROM projects WHERE id=?', (pid,))), 201

@app.route('/api/projects/<pid>', methods=['GET'])
def get_project(pid):
    project = qone('SELECT * FROM projects WHERE id=?', (pid,))
    if not project:
        return jsonify({'error': 'Not found'}), 404
    project['proposals']    = qall('SELECT * FROM proposals WHERE project_id=? ORDER BY created_at DESC', (pid,))
    project['requirements'] = qall('SELECT * FROM requirements WHERE project_id=? ORDER BY created_at DESC', (pid,))
    project['milestones']   = qall('SELECT * FROM milestones WHERE project_id=? ORDER BY created_at ASC', (pid,))
    return jsonify(project)

@app.route('/api/projects/<pid>', methods=['PUT'])
def update_project(pid):
    b = request.get_json(force=True, silent=True) or {}
    conn.execute('UPDATE projects SET title=?,description=?,category=?,budget=?,deadline=?,status=?,progress=?,client_name=?,skills=? WHERE id=?',
                 (b.get('title'), b.get('description'), b.get('category'), b.get('budget'),
                  b.get('deadline'), b.get('status'), b.get('progress', 0), b.get('client_name'), b.get('skills'), pid))
    conn.commit()
    return jsonify(qone('SELECT * FROM projects WHERE id=?', (pid,)))

@app.route('/api/projects/<pid>', methods=['DELETE'])
def delete_project(pid):
    conn.execute('DELETE FROM proposals WHERE project_id=?', (pid,))
    conn.execute('DELETE FROM requirements WHERE project_id=?', (pid,))
    conn.execute('DELETE FROM milestones WHERE project_id=?', (pid,))
    conn.execute('DELETE FROM projects WHERE id=?', (pid,))
    conn.commit()
    return jsonify({'ok': True})

# ── MILESTONES ────────────────────────────────────────────────────────────────
@app.route('/api/projects/<pid>/milestones', methods=['GET'])
def get_milestones(pid):
    return jsonify(qall('SELECT * FROM milestones WHERE project_id=? ORDER BY created_at ASC', (pid,)))

@app.route('/api/projects/<pid>/milestones', methods=['POST'])
def create_milestone(pid):
    b = request.get_json(force=True, silent=True) or {}
    mid = new_id()
    ts = now_str()
    conn.execute('INSERT INTO milestones (id,project_id,title,is_done,created_at) VALUES (?,?,?,?,?)',
                 (mid, pid, b.get('title'), 1 if b.get('is_done') else 0, ts))
    conn.commit()
    return jsonify(qone('SELECT * FROM milestones WHERE id=?', (mid,))), 201

@app.route('/api/milestones/<mid>', methods=['PUT'])
def update_milestone(mid):
    b = request.get_json(force=True, silent=True) or {}
    conn.execute('UPDATE milestones SET is_done=? WHERE id=?', (1 if b.get('is_done') else 0, mid))
    ms = qone('SELECT * FROM milestones WHERE id=?', (mid,))
    if ms:
        all_count  = qone('SELECT COUNT(*) as c FROM milestones WHERE project_id=?', (ms['project_id'],))['c']
        done_count = qone('SELECT COUNT(*) as c FROM milestones WHERE project_id=? AND is_done=1', (ms['project_id'],))['c']
        progress = round((done_count / all_count) * 100) if all_count > 0 else 0
        conn.execute('UPDATE projects SET progress=? WHERE id=?', (progress, ms['project_id']))
    conn.commit()
    return jsonify({'ok': True})

@app.route('/api/milestones/<mid>', methods=['DELETE'])
def delete_milestone(mid):
    conn.execute('DELETE FROM milestones WHERE id=?', (mid,))
    conn.commit()
    return jsonify({'ok': True})

# ── PROPOSALS ─────────────────────────────────────────────────────────────────
@app.route('/api/projects/<pid>/proposals', methods=['GET'])
def get_proposals(pid):
    return jsonify(qall('SELECT * FROM proposals WHERE project_id=? ORDER BY created_at DESC', (pid,)))

@app.route('/api/projects/<pid>/proposals', methods=['POST'])
def create_proposal(pid):
    b = request.get_json(force=True, silent=True) or {}
    prid = new_id()
    ts = now_str()
    conn.execute('INSERT INTO proposals (id,project_id,freelancer_name,freelancer_id,cover_letter,bid_amount,delivery_days,created_at) VALUES (?,?,?,?,?,?,?,?)',
                 (prid, pid, b.get('freelancer_name'), b.get('freelancer_id'),
                  b.get('cover_letter'), b.get('bid_amount', 0), b.get('delivery_days', 7), ts))
    proj = qone('SELECT title, client_id FROM projects WHERE id=?', (pid,))
    conn.execute('INSERT INTO notifications (id,type,title,message,user_id,created_at) VALUES (?,?,?,?,?,?)',
                 (new_id(), 'proposal', 'Жаңа өтінім келді',
                  f'"{proj["title"] if proj else "Жоба"}" жобасына {b.get("freelancer_name")} өтінім берді',
                  proj['client_id'] if proj else None, ts))
    conn.commit()
    return jsonify(qone('SELECT * FROM proposals WHERE id=?', (prid,))), 201

@app.route('/api/proposals/<prid>', methods=['PUT'])
def update_proposal(prid):
    b = request.get_json(force=True, silent=True) or {}
    conn.execute('UPDATE proposals SET status=? WHERE id=?', (b.get('status'), prid))
    proposal = qone('SELECT * FROM proposals WHERE id=?', (prid,))
    if proposal and b.get('status') == 'accepted':
        fl = qone('SELECT user_id FROM freelancers WHERE name=?', (proposal['freelancer_name'],))
        proj = qone('SELECT title FROM projects WHERE id=?', (proposal['project_id'],))
        if fl:
            ts = now_str()
            conn.execute('INSERT INTO notifications (id,type,title,message,user_id,created_at) VALUES (?,?,?,?,?,?)',
                         (new_id(), 'project', 'Өтініміңіз қабылданды!',
                          f'"{proj["title"] if proj else ""}" жобасына өтініміңіз қабылданды', fl['user_id'], ts))
    conn.commit()
    return jsonify(qone('SELECT * FROM proposals WHERE id=?', (prid,)))

# ── REQUIREMENTS ──────────────────────────────────────────────────────────────
@app.route('/api/projects/<pid>/requirements', methods=['GET'])
def get_requirements(pid):
    return jsonify(qall('SELECT * FROM requirements WHERE project_id=? ORDER BY created_at DESC', (pid,)))

@app.route('/api/projects/<pid>/requirements', methods=['POST'])
def create_requirement(pid):
    b = request.get_json(force=True, silent=True) or {}
    rid = new_id()
    ts = now_str()
    conn.execute('INSERT INTO requirements (id,project_id,title,description,type,priority,status,created_at) VALUES (?,?,?,?,?,?,?,?)',
                 (rid, pid, b.get('title'), b.get('description', ''), b.get('type', 'functional'),
                  b.get('priority', 'medium'), b.get('status', 'new'), ts))
    conn.commit()
    return jsonify(qone('SELECT * FROM requirements WHERE id=?', (rid,))), 201

@app.route('/api/requirements/<rid>', methods=['PUT'])
def update_requirement(rid):
    b = request.get_json(force=True, silent=True) or {}
    conn.execute('UPDATE requirements SET title=?,description=?,type=?,priority=?,status=? WHERE id=?',
                 (b.get('title'), b.get('description'), b.get('type'), b.get('priority'), b.get('status'), rid))
    conn.commit()
    return jsonify(qone('SELECT * FROM requirements WHERE id=?', (rid,)))

@app.route('/api/requirements/<rid>', methods=['DELETE'])
def delete_requirement(rid):
    conn.execute('DELETE FROM requirements WHERE id=?', (rid,))
    conn.commit()
    return jsonify({'ok': True})

# ── FREELANCERS ───────────────────────────────────────────────────────────────
@app.route('/api/freelancers', methods=['GET'])
def get_freelancers():
    approved  = request.args.get('approved')
    min_rate  = request.args.get('min_rate')
    max_rate  = request.args.get('max_rate')
    min_rating = request.args.get('min_rating')
    search    = request.args.get('search')
    sql = 'SELECT * FROM freelancers WHERE 1=1'
    params = []
    if approved is not None: sql += f' AND is_approved={1 if approved == "1" else 0}'
    if min_rate: sql += ' AND hourly_rate >= ?'; params.append(int(min_rate))
    if max_rate: sql += ' AND hourly_rate <= ?'; params.append(int(max_rate))
    if search:   sql += ' AND (name LIKE ? OR title LIKE ? OR skills LIKE ?)'; params += [f'%{search}%']*3
    sql += ' ORDER BY jobs_done DESC'
    freelancers = qall(sql, params)
    result = []
    for f in freelancers:
        reviews = qall('SELECT * FROM reviews WHERE freelancer_id=? ORDER BY created_at DESC', (f['id'],))
        avg = round(sum(r['rating'] for r in reviews) / len(reviews), 1) if reviews else 0
        if min_rating and avg < float(min_rating):
            continue
        f['reviews'] = reviews
        f['avgRating'] = avg
        result.append(f)
    return jsonify(result)

@app.route('/api/freelancers/by-user/<uid>', methods=['GET'])
def get_freelancer_by_user(uid):
    f = qone('SELECT * FROM freelancers WHERE user_id=?', (uid,))
    if not f:
        return jsonify({'error': 'Not found'}), 404
    reviews = qall('SELECT * FROM reviews WHERE freelancer_id=? ORDER BY created_at DESC', (f['id'],))
    avg = round(sum(r['rating'] for r in reviews) / len(reviews), 1) if reviews else 0
    f['reviews'] = reviews
    f['avgRating'] = avg
    f['portfolio'] = qall('SELECT * FROM portfolio WHERE freelancer_id=? ORDER BY created_at DESC', (f['id'],))
    return jsonify(f)

@app.route('/api/freelancers/<fid>', methods=['GET'])
def get_freelancer(fid):
    f = qone('SELECT * FROM freelancers WHERE id=?', (fid,))
    if not f:
        return jsonify({'error': 'Not found'}), 404
    reviews = qall('SELECT * FROM reviews WHERE freelancer_id=? ORDER BY created_at DESC', (fid,))
    avg = round(sum(r['rating'] for r in reviews) / len(reviews), 1) if reviews else 0
    f['reviews'] = reviews
    f['avgRating'] = avg
    f['portfolio'] = qall('SELECT * FROM portfolio WHERE freelancer_id=? ORDER BY created_at DESC', (fid,))
    return jsonify(f)

@app.route('/api/freelancers/<fid>', methods=['PUT'])
def update_freelancer(fid):
    b = request.get_json(force=True, silent=True) or {}
    conn.execute('UPDATE freelancers SET name=?,title=?,bio=?,skills=?,hourly_rate=?,location=? WHERE id=?',
                 (b.get('name'), b.get('title'), b.get('bio'), b.get('skills'), b.get('hourly_rate'), b.get('location'), fid))
    conn.commit()
    return jsonify(qone('SELECT * FROM freelancers WHERE id=?', (fid,)))

@app.route('/api/freelancers/<fid>/proposals', methods=['GET'])
def get_freelancer_proposals(fid):
    return jsonify(qall(
        'SELECT p.*, pr.title as project_title, pr.budget as project_budget '
        'FROM proposals p JOIN projects pr ON p.project_id=pr.id '
        'WHERE p.freelancer_id=? ORDER BY p.created_at DESC', (fid,)
    ))

@app.route('/api/freelancers/<fid>/reviews', methods=['POST'])
def create_review(fid):
    b = request.get_json(force=True, silent=True) or {}
    rid = new_id()
    ts = now_str()
    conn.execute('INSERT INTO reviews (id,freelancer_id,client_name,rating,comment,created_at) VALUES (?,?,?,?,?,?)',
                 (rid, fid, b.get('client_name'), b.get('rating', 5), b.get('comment', ''), ts))
    f = qone('SELECT name FROM freelancers WHERE id=?', (fid,))
    conn.execute('INSERT INTO notifications (id,type,title,message,created_at) VALUES (?,?,?,?,?)',
                 (new_id(), 'review', 'Жаңа пікір қалдырылды',
                  f'{b.get("client_name")} {f["name"] if f else "фрилансерге"} {b.get("rating")} жұлдыз берді', ts))
    conn.commit()
    return jsonify(qone('SELECT * FROM reviews WHERE id=?', (rid,))), 201

# ── PORTFOLIO ─────────────────────────────────────────────────────────────────
@app.route('/api/freelancers/<fid>/portfolio', methods=['GET'])
def get_portfolio(fid):
    return jsonify(qall('SELECT * FROM portfolio WHERE freelancer_id=? ORDER BY created_at DESC', (fid,)))

@app.route('/api/freelancers/<fid>/portfolio', methods=['POST'])
def create_portfolio(fid):
    b = request.get_json(force=True, silent=True) or {}
    pid = new_id()
    ts = now_str()
    conn.execute('INSERT INTO portfolio (id,freelancer_id,title,description,tech,url,created_at) VALUES (?,?,?,?,?,?,?)',
                 (pid, fid, b.get('title'), b.get('description', ''), b.get('tech', ''), b.get('url', ''), ts))
    conn.commit()
    return jsonify(qone('SELECT * FROM portfolio WHERE id=?', (pid,))), 201

@app.route('/api/portfolio/<pid>', methods=['DELETE'])
def delete_portfolio(pid):
    conn.execute('DELETE FROM portfolio WHERE id=?', (pid,))
    conn.commit()
    return jsonify({'ok': True})

# ── MESSAGES ──────────────────────────────────────────────────────────────────
@app.route('/api/messages', methods=['GET'])
def get_messages():
    user_id       = request.args.get('user_id')
    other_user_id = request.args.get('other_user_id')
    project_id    = request.args.get('project_id')

    if project_id and user_id and other_user_id:
        msgs = qall(
            'SELECT * FROM messages WHERE project_id=? '
            'AND ((from_user_id=? AND to_user_id=?) OR (from_user_id=? AND to_user_id=?)) '
            'ORDER BY created_at ASC',
            (project_id, user_id, other_user_id, other_user_id, user_id)
        )
        conn.execute('UPDATE messages SET is_read=1 WHERE to_user_id=? AND from_user_id=? AND project_id=?',
                     (user_id, other_user_id, project_id))
        conn.commit()
        return jsonify(msgs)

    if user_id:
        convs = qall(
            """SELECT DISTINCT
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
               ORDER BY last_at DESC""",
            (user_id, user_id, user_id, user_id, user_id, user_id)
        )
        return jsonify(convs)

    return jsonify([])

@app.route('/api/messages', methods=['POST'])
def send_message():
    b = request.get_json(force=True, silent=True) or {}
    mid = new_id()
    ts = now_str()
    conn.execute('INSERT INTO messages (id,project_id,from_user_id,to_user_id,from_name,content,created_at) VALUES (?,?,?,?,?,?,?)',
                 (mid, b.get('project_id'), b.get('from_user_id'), b.get('to_user_id'), b.get('from_name'), b.get('content'), ts))
    conn.execute('INSERT INTO notifications (id,type,title,message,user_id,created_at) VALUES (?,?,?,?,?,?)',
                 (new_id(), 'message', 'Жаңа хабарлама', f'{b.get("from_name")} сізге хабарлама жіберді', b.get('to_user_id'), ts))
    conn.commit()
    return jsonify(qone('SELECT * FROM messages WHERE id=?', (mid,))), 201

# ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    user_id = request.args.get('user_id')
    if user_id:
        return jsonify(qall('SELECT * FROM notifications WHERE user_id=? OR user_id IS NULL ORDER BY created_at DESC', (user_id,)))
    return jsonify(qall('SELECT * FROM notifications ORDER BY created_at DESC'))

@app.route('/api/notifications/read-all', methods=['PUT'])
def read_all_notifications():
    conn.execute('UPDATE notifications SET is_read=1')
    conn.commit()
    return jsonify({'ok': True})

@app.route('/api/notifications/<nid>/read', methods=['PUT'])
def read_notification(nid):
    conn.execute('UPDATE notifications SET is_read=1 WHERE id=?', (nid,))
    conn.commit()
    return jsonify({'ok': True})

# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print('Freelanzer Python backend: http://localhost:5000')
    app.run(host='0.0.0.0', port=5000, debug=False)
