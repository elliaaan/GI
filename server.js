// server.js
require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const connectDB = require('./config/db');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');

// Подключаемся к БД
connectDB();

// Настраиваем EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Папка для статических файлов (CSS, изображения и т.д.)
app.use(express.static(path.join(__dirname, 'public')));

// Для чтения body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Поддержка PUT/DELETE через form
app.use(methodOverride('_method'));

// Сессии
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60 // время жизни сессии
  })
}));

// Маршруты
const authRoutes = require('./routes/auth');
const indexRoutes = require('./routes/index');

app.use('/', indexRoutes);
app.use('/auth', authRoutes);

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
