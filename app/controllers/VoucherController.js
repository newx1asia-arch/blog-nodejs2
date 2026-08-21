// app/controllers/VoucherController.js
const Voucher = require('../models/Voucher');

// Chỉ chấp nhận redirect nội bộ (bắt đầu bằng "/") để tránh open-redirect
function safeReturnTo(value) {
    return (typeof value === 'string' && value.startsWith('/')) ? value : '/me/vouchers';
}

class VoucherController {
    // [GET] /me/vouchers
    async index(req, res, next) {
        try {
            const vouchers = await Voucher.find({ seller: req.session.userId }).sort({ createdAt: -1 }).lean();
            res.render('me/vouchers', {
                vouchers,
                success: req.session.voucherSuccess || null,
                error: req.session.voucherFormError || null
            });
            req.session.voucherSuccess = null;
            req.session.voucherFormError = null;
        } catch (error) {
            next(error);
        }
    }

    // [POST] /me/vouchers
    // Dùng chung cho trang "/me/vouchers" lẫn form voucher rút gọn ở "/products/create" và
    // "/products/:id/edit". Nếu form gửi kèm input hidden "returnTo", sau khi tạo xong sẽ
    // quay lại đúng trang đó thay vì luôn nhảy về /me/vouchers.
    async store(req, res, next) {
        const returnTo = safeReturnTo(req.body.returnTo);
        try {
            const code = (req.body.code || '').trim().toUpperCase();
            const type = req.body.type === 'fixed' ? 'fixed' : 'percent';
            const value = Number(req.body.value) || 0;
            const minOrder = Number(req.body.minOrder) || 0;
            const maxDiscount = req.body.maxDiscount ? Number(req.body.maxDiscount) : undefined;
            const usageLimit = Number(req.body.usageLimit) || 0;
            const expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : undefined;

            if (!code || value <= 0) {
                req.session.voucherFormError = 'Vui lòng nhập mã và giá trị giảm hợp lệ.';
                return res.redirect(returnTo);
            }
            if (type === 'percent' && value > 100) {
                req.session.voucherFormError = 'Giảm theo % không được vượt quá 100%.';
                return res.redirect(returnTo);
            }

            const existing = await Voucher.findOne({ code });
            if (existing) {
                req.session.voucherFormError = 'Mã giảm giá này đã tồn tại, vui lòng chọn mã khác.';
                return res.redirect(returnTo);
            }

            await Voucher.create({
                code, type, value, minOrder, maxDiscount, usageLimit, expiresAt,
                active: true,
                seller: req.session.userId
            });

            req.session.voucherSuccess = 'Tạo voucher thành công! Voucher đã hiển thị trên trang cửa hàng của bạn.';
            res.redirect(returnTo);
        } catch (error) {
            next(error);
        }
    }

    // [POST] /me/vouchers/:id/toggle
    async toggle(req, res, next) {
        try {
            const voucher = await Voucher.findOne({ _id: req.params.id, seller: req.session.userId });
            if (voucher) {
                voucher.active = !voucher.active;
                await voucher.save();
            }
            res.redirect('/me/vouchers');
        } catch (error) {
            next(error);
        }
    }

    // [DELETE] /me/vouchers/:id
    async destroy(req, res, next) {
        try {
            await Voucher.deleteOne({ _id: req.params.id, seller: req.session.userId });
            res.redirect('/me/vouchers');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new VoucherController();