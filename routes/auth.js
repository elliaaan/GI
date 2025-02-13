const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

//regular expressionfor email validation
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

//function to validate password
const isValidPassword = (password) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);

// request Get
router.get('/register', (req, res) => {
  res.render('pages/register'); 
});

// request POST
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // check if fields are empty
    if (!email || !password) {
      return res.render('pages/register', { error: 'Please fill all fields' });
    }

    // validate email
    if (!emailRegex.test(email)) {
      return res.render('pages/register', { error: 'Invalid email format' });
    }

    // validate password
    if (!isValidPassword(password)) {
      return res.render('pages/register', { 
        error: 'Password must be at least 8 characters long and contain at least one letter and one number' 
      });
    }

    // check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('pages/register', { error: 'User already exists' });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // create user
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

// login get
router.get('/login', (req, res) => {
  res.render('pages/login');
});

// login post
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

    // check if account is locked
    if (user.isLocked) {
      return res.render('pages/login', { error: 'Account locked. Contact support.' });
    }

    // ensure password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      //  the number of failed login attempts
      user.failedLoginAttempts += 1;

      // if the number of failed login attempts is greater than or equal to 5, lock the account
      if (user.failedLoginAttempts >= 5) {
        user.isLocked = true;
      }
      await user.save();

      return res.render('pages/login', { error: 'Invalid password' });
    }

    //if the password is correct, reset the number of failed login attempts
    user.failedLoginAttempts = 0;
    await user.save();

    // save user data
    req.session.user = { id: user._id, email: user.email };
    return res.redirect('/profile');
  } catch (err) {
    console.error(err);
    return res.render('pages/login', { error: 'Something went wrong' });
  }
});

// LOGOUT
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.log(err);
    res.redirect('/');
  });
});

module.exports = router;
