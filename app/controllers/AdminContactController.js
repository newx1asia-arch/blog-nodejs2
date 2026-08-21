// app/controllers/AdminContactController.js
const Contact = require('../models/Contact');

// Gửi email phản hồi cho khách — chỉ kích hoạt nếu cấu hình SMTP_HOST trong .env.
// Nếu chưa cấu hình, hệ thống vẫn lưu lại phản hồi để admin copy gửi thủ công.
let transporter = null;
if (process.env.SMTP_HOST) {
    const nodemailer = require('nodemailer');
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
}

class AdminContactController {
    // [GET] /admin/contacts?status=new|resolved
    async index(req, res, next) {
        try {
            const status = ['new', 'resolved'].includes(req.query.status) ? req.query.status : 'new';
            const contacts = await Contact.find({ status }).sort({ createdAt: -1 }).lean();
            res.render('admin/contacts', {
                contacts,
                status,
                success: req.session.contactReplySuccess || null
            });
            req.session.contactReplySuccess = null;
        } catch (error) {
            next(error);
        }
    }

    // [POST] /admin/contacts/:id/reply
    async reply(req, res, next) {
        try {
            const replyText = (req.body.adminReply || '').trim();
            if (!replyText) return res.redirect('/admin/contacts');

            const contact = await Contact.findById(req.params.id);
            if (!contact) return res.redirect('/admin/contacts');

            contact.adminReply = replyText;
            contact.repliedAt = Date.now();
            contact.status = 'resolved';
            await contact.save();

            if (transporter) {
                try {
                    await transporter.sendMail({
                        from: process.env.SMTP_FROM || process.env.SMTP_USER,
                        to: contact.email,
                        subject: 'Phản hồi từ ShopVN về liên hệ của bạn',
                        text: replyText
                    });
                } catch (mailErr) {
                    console.error('Lỗi gửi email phản hồi:', mailErr);
                }
            }

            req.session.contactReplySuccess = transporter
                ? 'Đã lưu phản hồi và gửi email cho khách hàng.'
                : `Đã lưu phản hồi. (Chưa cấu hình SMTP nên chưa tự gửi email — hãy gửi thủ công tới ${contact.email})`;
            res.redirect('/admin/contacts');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AdminContactController();