const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const User = require('../models/User');
require('dotenv').config();

// 📌 Конфигурация Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 📌 Настройка хранилища Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "profile_pictures",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });

// 📌 Middleware для проверки авторизации
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect('/auth/login');
}

// 📌 Маршрут для главной страницы
router.get('/', (req, res) => {
  res.render('home', { user: req.session.user });
});

// 📌 Страница профиля
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    res.render('profile', { user });
  } catch (error) {
    console.error('Error loading profile:', error);
    res.redirect('/');
  }
});

// 📌 Обновление профиля (загрузка фото в Cloudinary)
router.put('/profile', isAuthenticated, upload.single('profilePicture'), async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) return res.redirect('/');

    // 📌 Проверяем, есть ли загруженный файл
    if (req.file) {
      user.profilePicture = req.file.path; // Cloudinary возвращает URL
    }

    await user.save();
    return res.redirect('/profile');
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
