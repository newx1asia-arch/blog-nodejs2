const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { mergeCartOnLogin } = require('../services/cartService');

const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback';

const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL
);

class AuthController {
    showRegister(req, res) {
        res.render('auth/register');
    }

    async register(req, res, next) {
        try {
            const { name, email, password, confirmPassword } = req.body;

            if (!name || !email || !password) {
                return res.render('auth/register', { error: 'Vui lòng điền đầy đủ thông tin.' });
            }
            if (password !== confirmPassword) {
                return res.render('auth/register', { error: 'Mật khẩu xác nhận không khớp.' });
            }
            if (password.length < 6) {
                return res.render('auth/register', { error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
            }

            const existing = await User.findOne({ email: email.toLowerCase().trim() });
            if (existing) {
                return res.render('auth/register', { error: 'Email này đã được đăng ký.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await User.create({
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password: hashedPassword
            });

            req.session.userId = user._id;
            req.session.userName = user.name;
            req.session.userAvatar = user.avatar || null;
            req.session.userRole = user.role || 'user';
            await mergeCartOnLogin(req, user._id);

            res.redirect('/');
        } catch (error) {
            next(error);
        }
    }

    showLogin(req, res) {
        const errorMessages = {
            google_failed: 'Đăng nhập bằng Google thất bại, vui lòng thử lại.',
            google_no_email: 'Không lấy được email từ tài khoản Google này.'
        };
        res.render('auth/login', { error: errorMessages[req.query.error] || null });
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email: (email || '').toLowerCase().trim() });

            if (!user || !user.password) {
                return res.render('auth/login', { error: 'Email hoặc mật khẩu không đúng.' });
            }

            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return res.render('auth/login', { error: 'Email hoặc mật khẩu không đúng.' });
            }

            req.session.userId = user._id;
            req.session.userName = user.name;
            req.session.userAvatar = user.avatar || null;
            req.session.userRole = user.role || 'user';
            await mergeCartOnLogin(req, user._id);

            res.redirect('/');
        } catch (error) {
            next(error);
        }
    }

    logout(req, res, next) {
        req.session.destroy(err => {
            if (err) return next(err);
            res.redirect('/');
        });
    }

    googleLogin(req, res) {
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['openid', 'email', 'profile'],
            prompt: 'select_account'
        });
        res.redirect(url);
    }

    async googleCallback(req, res, next) {
        try {
            const { code } = req.query;
            if (!code) return res.redirect('/auth/login?error=google_failed');

            const { tokens } = await oauth2Client.getToken(code);
            const ticket = await oauth2Client.verifyIdToken({
                idToken: tokens.id_token,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            const payload = ticket.getPayload();

            if (!payload || !payload.email) {
                return res.redirect('/auth/login?error=google_no_email');
            }

            const email = payload.email.toLowerCase().trim();
            let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email }] });

            if (!user) {
                user = await User.create({
                    name: payload.name || email.split('@')[0],
                    email,
                    googleId: payload.sub,
                    avatar: payload.picture || null
                });
            } else if (!user.googleId) {
                user.googleId = payload.sub;
                if (!user.avatar && payload.picture) user.avatar = payload.picture;
                await user.save();
            }

            req.session.userId = user._id;
            req.session.userName = user.name;
            req.session.userAvatar = user.avatar || null;
            req.session.userRole = user.role || 'user';
            await mergeCartOnLogin(req, user._id);

            res.redirect('/');
        } catch (error) {
            console.error('Lỗi đăng nhập Google:', error);
            res.redirect('/auth/login?error=google_failed');
        }
    }
}

module.exports = new AuthController();