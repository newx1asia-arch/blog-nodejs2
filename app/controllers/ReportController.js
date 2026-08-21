const Report = require('../models/Report');
const Product = require('../models/Product');

const REASON_LABELS = {
    fake: 'Hàng giả / hàng nhái',
    prohibited: 'Sản phẩm cấm / vi phạm pháp luật',
    spam: 'Spam / lừa đảo',
    copyright: 'Vi phạm bản quyền',
    other: 'Lý do khác'
};

class ReportController {
    // [POST] /products/:id/report
    async store(req, res, next) {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).send('<h1>404 - Sản phẩm không tồn tại</h1><a href="/">Quay về trang chủ</a>');
            }

            const reason = REASON_LABELS[req.body.reason] ? req.body.reason : 'other';

            // upsert: nếu người này đã từng tố cáo sản phẩm này -> cập nhật lại lý do thay vì tạo trùng
            await Report.findOneAndUpdate(
                { product: product._id, reporter: req.session.userId },
                {
                    product: product._id,
                    reporter: req.session.userId,
                    reason,
                    note: (req.body.note || '').trim(),
                    status: 'pending',
                    createdAt: Date.now()
                },
                { upsert: true, new: true }
            );

            res.redirect(`/products/${product.slug}#reviews`);
        } catch (error) {
            next(error);
        }
    }

    // [GET] /admin/reports?status=pending|resolved|dismissed
    async index(req, res, next) {
        try {
            const status = ['pending', 'resolved', 'dismissed'].includes(req.query.status) ? req.query.status : 'pending';

            const reports = await Report.find({ status })
                .sort({ createdAt: -1 })
                .populate('product', 'name slug img price')
                .populate('reporter', 'name email')
                .lean();

            const safeReports = reports
                .filter(r => r.product) // phòng trường hợp sản phẩm đã bị xóa bằng cách khác
                .map(r => ({ ...r, reasonLabel: REASON_LABELS[r.reason] || r.reason }));

            res.render('admin/reports', { reports: safeReports, status });
        } catch (error) {
            next(error);
        }
    }

    // [POST] /admin/reports/:id/takedown — gỡ bài vi phạm: xoá sản phẩm + đóng toàn bộ report liên quan
    async takedown(req, res, next) {
        try {
            const report = await Report.findById(req.params.id);
            if (!report) return res.redirect('/admin/reports');

            await Product.deleteOne({ _id: report.product });
            await Report.updateMany({ product: report.product }, { status: 'resolved' });

            res.redirect('/admin/reports');
        } catch (error) {
            next(error);
        }
    }

    // [POST] /admin/reports/:id/dismiss — bỏ qua, sản phẩm không vi phạm
    async dismiss(req, res, next) {
        try {
            await Report.findByIdAndUpdate(req.params.id, { status: 'dismissed' });
            res.redirect('/admin/reports');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ReportController();