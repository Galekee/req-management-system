# Талаптарды Басқару Жүйесі

**АЖ-49 командасы** · IT Жобаларды Басқару курсы · 2026/2027

Бұл жоба IT-жобасының талаптарын басқаруға арналған толыққанды веб-қосымша (fullstack). React + Node.js + SQLite стекінде жасалған.

---

## 🚀 Іске қосу нұсқаулары

### Алдын-ала талаптар
- Node.js 22+
- npm

### 1. Backend іске қосу

```bash
cd backend
npm install
node --experimental-sqlite src/index.js
npm start
```

Сервер `http://localhost:5000` мекенжайында іске қосылады.

### 2. Frontend іске қосу

```bash
cd frontend
npm install
npm start
```

Браузерде `http://localhost:3000` мекенжайы ашылады.

---

## 📁 Жоба құрылымы

```
req-management-system/
├── backend/
│   ├── src/
│   │   └── index.js        # Express API сервері (SQLite)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.js          # Дашборд (статистика, диаграммалар)
│   │   │   ├── RequirementsList.js   # Талаптар тізімі (сүзгілер)
│   │   │   ├── RequirementForm.js    # Талап қосу/өзгерту формасы
│   │   │   └── RequirementDetail.js  # Талаптың толық ақпараты
│   │   ├── App.js           # Маршруттау, бүйірлік панель
│   │   ├── App.css          # Қараңғы тақырып стильдері
│   │   └── index.js
│   └── package.json
└── README.md
```

---

## 🛠 Технологиялар

| Қабат | Технология |
|---|---|
| Frontend | React 18, React Router v6, Recharts, Lucide Icons |
| Backend | Node.js (built-in HTTP + SQLite) |
| Database | SQLite (node:sqlite) |
| Styling | Custom dark theme CSS |

---

## 📊 Функционал

- **Дашборд**: жалпы статистика, статус/басымдық/орындаушы бойынша диаграммалар
- **Тізім**: барлық талаптарды кесте түрінде көру, сүзгілеу, іздеу
- **Форма**: жаңа талап қосу, бар талапты өзгерту
- **Толық ақпарат**: талаптың барлық мәліметтері, пікірлер бөлімі

---

## 👥 Команда

| Аты | Рөлі |
|---|---|
| Балапан Бекарыс | Разработчик (фронтенд + бэкенд) |
| Газезов Саят | Аналитик (құжаттама + жоспарлау) |
