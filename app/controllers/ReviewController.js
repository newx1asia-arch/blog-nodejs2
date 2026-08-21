const Review = require('../models/Review');
const Product = require('../models/Product');

class ReviewController {
    async store(req, res, next) {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).send('<h1>404 - Sản phẩm không tồn tại</h1><a href="/">Quay về trang chủ</a>');
            }

            const already = await Review.findOne({ product: product._id, user: req.session.userId });
            if (already) {
                return res.redirect(`/products/${product.slug}#reviews`);
            }

            await Review.create({
                product: product._id,
                user: req.session.userId,
                userName: req.session.userName,
                userAvatar: req.session.userAvatar || null,
                rating: Math.min(5, Math.max(1, parseInt(req.body.rating) || 5)),
                comment: (req.body.comment || '').trim()
            });

            const reviews = await Review.find({ product: product._id });
            const total = reviews.reduce((sum, r) => sum + r.rating, 0);
            product.ratingCount = reviews.length;
            product.ratingAvg = reviews.length ? +(total / reviews.length).toFixed(1) : 0;
            await product.save();

            res.redirect(`/products/${product.slug}#reviews`);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ReviewController();