const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const User = require('../models/User');
require('dotenv').config();

// configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//Multer + Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "profile_pictures",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});
const upload = multer({ storage });

// Middleware check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect('/auth/login');
}

// main page
router.get('/', (req, res) => {
  res.render('pages/home', { user: req.session.user });
});

// profile page
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    res.render('pages/profile', { user });
  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
});

// update profile picture 
router.put('/profile', isAuthenticated, upload.single('profilePicture'), async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) return res.redirect('/');

    if (req.file) {
      user.profilePicture = req.file.path; // 📌 Cloudinary создаёт URL
    }

    await user.save();
    return res.redirect('/profile');
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).send('Internal Server Error');
  }
});

// delete profile picture
router.delete('/profile/delete-picture', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user || !user.profilePicture) return res.redirect('/profile');

    // get public_id of the picture
    const publicId = user.profilePicture.split('/').pop().split('.')[0];

    // delete picture from Cloudinary
    await cloudinary.uploader.destroy(`profile_pictures/${publicId}`);

    // delete picture from user
    user.profilePicture = '';
    await user.save();

    return res.redirect('/profile');
  } catch (error) {
    console.error('Delete picture error:', error);
    return res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
