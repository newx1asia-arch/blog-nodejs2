const Order = require('../models/Order');

class OrderController {
    async show(req, res, next) {
        try {
            const order = await Order.findById(req.params.id).lean();
            if (!order) {
                return res.status(404).send('<h1>404 - Không tìm thấy đơn hàng</h1><a href="/">Quay về trang chủ</a>');
            }
            if (order.buyer.toString() !== req.session.userId) {
                return res.status(403).send('<h1>403 - Bạn không có quyền xem đơn hàng này</h1><a href="/">Quay về trang chủ</a>');
            }
            res.render('order-detail', { order });
        } catch (error) {
            next(error);
        }
    }

    async mine(req, res, next) {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const pageSize = 10;
            const filter = { buyer: req.session.userId };

            const [orders, total] = await Promise.all([
                Order.find(filter).sort({ createdAt: -1 })
                    .skip((page - 1) * pageSize).limit(pageSize).lean(),
                Order.countDocuments(filter)
            ]);

            const totalPages = Math.max(1, Math.ceil(total / pageSize));
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

module.exports = new OrderController();