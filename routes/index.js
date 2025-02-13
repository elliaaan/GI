// routes/index.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');

// Middleware для проверки авторизации
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect('/auth/login');
}

// Настраиваем multer для загрузки фото
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads'); 
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
    // Если есть другие поля для обновления, можно их здесь обработать
    // user.name = req.body.name;
    await user.save();

    return res.redirect('/profile');
  } catch (error) {
    console.error(error);
    return res.redirect('/profile');
  }
});

module.exports = router;
