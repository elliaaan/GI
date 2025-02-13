const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

// Middleware для проверки авторизации
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect('/auth/login');
}

// Создаём папку `public/uploads`, если её нет
const uploadDir = path.join(__dirname, '../public/uploads/');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Настраиваем Multer для загрузки фото
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Используем полный путь
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Главная страница
router.get('/', (req, res) => {
  res.render('pages/home', { user: req.session.user });
});

// Страница профиля
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    res.render('pages/profile', { user });
  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
});

// Обновление профиля (в том числе загрузка фото)
router.put('/profile', isAuthenticated, upload.single('profilePicture'), async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) return res.redirect('/');

    if (req.file) {
      user.profilePicture = '/uploads/' + req.file.filename;
    }

    await user.save();
    return res.redirect('/profile');
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
