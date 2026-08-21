const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Order = require('../models/Order');

const PAGE_SIZE = 10;

class MeController {
    // [GET] /me/profile
    async profile(req, res, next) {
        try {
            const user = await User.findById(req.session.userId).lean();
            if (!user) {
                return req.session.destroy(() => res.redirect('/auth/login'));
            }

            res.render('me/profile', {
                user,
                success: req.session.profileSuccess || null
            });
            req.session.profileSuccess = null;
        } catch (error) {
            next(error);
        }
    }

    // [POST] /me/profile
    async updateProfile(req, res, next) {
        try {
            const { name, phone, address } = req.body;

            if (!name || !name.trim()) {
                const user = await User.findById(req.session.userId).lean();
                return res.render('me/profile', { user, error: 'Họ tên không được để trống.' });
            }

            await User.updateOne({ _id: req.session.userId }, {
                name: name.trim(),
                phone: (phone || '').trim(),
                address: (address || '').trim()
            });

            req.session.userName = name.trim();
            req.session.profileSuccess = 'Cập nhật thông tin thành công.';
            res.redirect('/me/profile');
        } catch (error) {
            next(error);
        }
    }

    // [POST] /me/avatar
    async updateAvatar(req, res, next) {
        try {
            if (!req.file) {
                return res.redirect('/me/profile');
            }

            // Lưu avatar dạng base64 thẳng vào MongoDB (không ghi ra ổ đĩa)
            // để tránh mất ảnh khi server khởi động lại / redeploy.
            const avatarData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            await User.updateOne({ _id: req.session.userId }, { avatar: avatarData });

            req.session.userAvatar = avatarData;
            res.redirect('/me/profile');
        } catch (error) {
            next(error);
        }
    }

    // [GET] /me/password
    showChangePassword(req, res) {
        res.render('me/change-password', { error: req.session.passwordError || null });
        req.session.passwordError = null;
    }

    // [POST] /me/password
    async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword, confirmPassword } = req.body;

            if (!currentPassword || !newPassword || !confirmPassword) {
                req.session.passwordError = 'Vui lòng điền đầy đủ thông tin.';
                return res.redirect('/me/password');
            }
            if (newPassword !== confirmPassword) {
                req.session.passwordError = 'Mật khẩu mới xác nhận không khớp.';
                return res.redirect('/me/password');
            }
            if (newPassword.length < 6) {
                req.session.passwordError = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
                return res.redirect('/me/password');
            }

            const user = await User.findById(req.session.userId);
            const match = await bcrypt.compare(currentPassword, user.password);
            if (!match) {
                req.session.passwordError = 'Mật khẩu hiện tại không đúng.';
                return res.redirect('/me/password');
            }

            user.password = await bcrypt.hash(newPassword, 10);
            await user.save();

            res.redirect('/me/profile');
        } catch (error) {
            next(error);
        }
    }

    // [GET] /me/orders
    async orders(req, res, next) {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const filter = { buyer: req.session.userId };

            const [orders, total] = await Promise.all([
                Order.find(filter).sort({ createdAt: -1 })
                    .skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
                Order.countDocuments(filter)
            ]);

            const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
            res.render('me/my-orders', {
                orders,
                currentPage: page,
                totalPages,
                hasPrev: page > 1,
                hasNext: page < totalPages,
                prevPage: page - 1,
                nextPage: page + 1,
                pages: Array.from({ length: totalPages }, (_, i) => i + 1)
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new MeController();