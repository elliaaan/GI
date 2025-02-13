const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Регулярное выражение для валидации email
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Функция для валидации пароля (минимум 8 символов, хотя бы одна буква и цифра)
const isValidPassword = (password) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);

// Регистрация (GET)
router.get('/register', (req, res) => {
  res.render('pages/register'); 
});

// Регистрация (POST)
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Проверка заполнения полей
    if (!email || !password) {
      return res.render('pages/register', { error: 'Please fill all fields' });
    }

    // Валидация email
    if (!emailRegex.test(email)) {
      return res.render('pages/register', { error: 'Invalid email format' });
    }

    // Валидация пароля
    if (!isValidPassword(password)) {
      return res.render('pages/register', { 
        error: 'Password must be at least 8 characters long and contain at least one letter and one number' 
      });
    }

    // Проверяем, существует ли уже пользователь
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('pages/register', { error: 'User already exists' });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Создаём пользователя
    const newUser = new User({
      email,
      password: hashedPassword
    });
    await newUser.save();

    return res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    return res.render('pages/register', { error: 'Something went wrong' });
  }
});

// Логин (GET)
router.get('/login', (req, res) => {
  res.render('pages/login');
});

// Логин (POST)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.render('pages/login', { error: 'Please fill all fields' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.render('pages/login', { error: 'User not found' });
    }

    // Проверка, заблокирован ли пользователь
    if (user.isLocked) {
      return res.render('pages/login', { error: 'Account locked. Contact support.' });
    }

    // Сравниваем пароль
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Увеличиваем счётчик неудачных попыток
      user.failedLoginAttempts += 1;

      // Если достигли 5 неудачных попыток - блокируем
      if (user.failedLoginAttempts >= 5) {
        user.isLocked = true;
      }
      await user.save();

      return res.render('pages/login', { error: 'Invalid password' });
    }

    // Если пароль верный, сбрасываем счётчик и заходим
    user.failedLoginAttempts = 0;
    await user.save();

    // Сохраняем информацию в сессии
    req.session.user = { id: user._id, email: user.email };
    return res.redirect('/profile');
  } catch (err) {
    console.error(err);
    return res.render('pages/login', { error: 'Something went wrong' });
  }
});

// Логаут
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.log(err);
    res.redirect('/');
  });
});

module.exports = router;
