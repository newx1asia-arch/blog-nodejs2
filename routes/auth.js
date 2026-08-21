const express = require('express');
const router = express.Router();
const authController = require('../app/controllers/AuthController');

router.get('/register', authController.showRegister);
router.post('/register', authController.register);
router.get('/login', authController.showLogin);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Đăng nhập bằng Google
router.get('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);

module.exports = router;