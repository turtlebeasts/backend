const express = require('express');
const authRoutes = express.Router()
const { register_user, login, check_email } = require('../controllers/authController');

authRoutes.post('/register', register_user);
authRoutes.post('/check-email', check_email);
authRoutes.post('/login', login);

module.exports = authRoutes